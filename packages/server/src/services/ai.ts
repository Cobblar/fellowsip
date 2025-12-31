import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { db, tastingSummaries } from '../db/index.js';
import { getSessionMessages } from './messages.js';
import { getSession } from './sessions.js';
import { emitSummaryGenerated } from '../sockets/socketManager.js';
import { saveComparisonSummary } from './comparisonSummaries.js';


// Helper to get model
function getModel(type: 'product' | 'comparison' = 'product') {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

    const productSchema: any = {
        type: SchemaType.OBJECT,
        properties: {
            nose: { type: SchemaType.STRING },
            palate: { type: SchemaType.STRING },
            finish: { type: SchemaType.STRING },
            observations: { type: SchemaType.STRING },
            tasterSummaries: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        userId: { type: SchemaType.STRING },
                        userName: { type: SchemaType.STRING },
                        nose: { type: SchemaType.STRING },
                        palate: { type: SchemaType.STRING },
                        finish: { type: SchemaType.STRING },
                        observations: { type: SchemaType.STRING },
                    },
                    required: ['userId', 'userName', 'nose', 'palate', 'finish', 'observations'],
                },
            },
            metadata: {
                type: SchemaType.OBJECT,
                properties: {
                    tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    participants: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                },
            },
        },
        required: ['nose', 'palate', 'finish', 'observations'],
    };

    const comparisonSchema: any = {
        type: SchemaType.OBJECT,
        properties: {
            comparativeNotes: { type: SchemaType.STRING },
            rankings: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        productIndex: { type: SchemaType.NUMBER },
                        rank: { type: SchemaType.NUMBER },
                        notes: { type: SchemaType.STRING },
                    },
                    required: ['productIndex', 'rank', 'notes'],
                },
            },
        },
        required: ['comparativeNotes'],
    };

    return genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: type === 'product' ? productSchema : comparisonSchema,
        },
    });
}

export async function generateSessionSummary(sessionId: string) {
    try {
        console.log(`[AI] Generating summary for session ${sessionId}...`);

        const sessionData = await getSession(sessionId);
        if (!sessionData) throw new Error('Session not found');

        const products = (sessionData.session as any).products || [];
        const productSummaries = [];

        // 1. Generate independent summaries for each product
        for (const product of products) {
            console.log(`[AI] Generating summary for product ${product.index}: ${product.productName}`);
            const summary = await generateProductSummary(sessionId, product);
            if (summary) productSummaries.push(summary);
        }

        // If no products were defined (legacy or empty), try productIndex 0
        if (products.length === 0) {
            const summary = await generateProductSummary(sessionId, { index: 0, productName: sessionData.session.productName, productType: sessionData.session.productType, productLink: sessionData.session.productLink });
            if (summary) productSummaries.push(summary);
        }

        // 2. Generate comparison if multiple products
        if (productSummaries.length > 1) {
            console.log(`[AI] Generating comparative analysis for ${productSummaries.length} products`);
            await generateComparisonSummary(sessionId, productSummaries, products);
        }

        return productSummaries;
    } catch (error) {
        console.error('[AI] Failed to generate session summary:', error);
        emitSummaryGenerated(sessionId, null as any);
        return null;
    }
}

async function generateProductSummary(sessionId: string, product: any) {
    const model = getModel('product');
    const messages = await getSessionMessages(sessionId, 1000, product.index);

    if (messages.length === 0) {
        const [saved] = await db.insert(tastingSummaries).values({
            sessionId,
            productIndex: product.index,
            nose: 'No aromas recorded.',
            palate: 'No flavor notes recorded.',
            finish: 'No finish notes recorded.',
            observations: 'No messages for this product.',
            metadata: { tags: [], participants: [] },
        }).onConflictDoUpdate({
            target: [tastingSummaries.sessionId, tastingSummaries.productIndex],
            set: { observations: 'No messages for this product.', generatedAt: new Date() }
        }).returning();
        emitSummaryGenerated(sessionId, saved.id);
        return saved;
    }

    const transcript = messages.map(m =>
        `${m.user?.displayName || 'Anonymous'} [ID: ${m.user?.id || 'unknown'}]: ${m.message.content}`
    ).join('\n');

    const prompt = `
        Analyze this tasting session for: ${product.productName || 'Product ' + (product.index + 1)} (${product.productType || 'Unknown'}).
        Transcript:
        ${transcript}
    `;

    const result = await model.generateContent(prompt);
    const summaryData = JSON.parse(result.response.text());

    const [saved] = await db.insert(tastingSummaries).values({
        sessionId,
        productIndex: product.index,
        ...summaryData
    }).onConflictDoUpdate({
        target: [tastingSummaries.sessionId, tastingSummaries.productIndex],
        set: { ...summaryData, generatedAt: new Date() }
    }).returning();

    emitSummaryGenerated(sessionId, saved.id);
    return saved;
}

async function generateComparisonSummary(sessionId: string, productSummaries: any[], products: any[]) {
    const model = getModel('comparison');

    const summariesText = productSummaries.map((s, i) => {
        const p = products.find(p => p.index === s.productIndex) || products[i];
        return `Product ${s.productIndex} (${p.productName}):
        Nose: ${s.nose}
        Palate: ${s.palate}
        Finish: ${s.finish}
        Observations: ${s.observations}`;
    }).join('\n\n');

    const prompt = `
        Compare these products from the tasting session. 
        Provide a comparative analysis and rankings if the group expressed preferences.
        
        Summaries:
        ${summariesText}
    `;

    const result = await model.generateContent(prompt);
    const comparisonData = JSON.parse(result.response.text());

    return await saveComparisonSummary(sessionId, comparisonData);
}
