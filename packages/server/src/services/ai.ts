import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { db, tastingSummaries } from '../db/index.js';
import { getSessionMessages } from './messages.js';
import { getSession } from './sessions.js';
import { emitSummaryGenerated } from '../sockets/socketManager.js';
import { saveComparisonSummary } from './comparisonSummaries.js';


// Helper to get model
function getModel(type: 'product' | 'comparison' = 'product', isSolo: boolean = false) {
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
        required: isSolo ? [] : ['nose', 'palate', 'finish', 'observations'],
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

        const isSolo = (sessionData.session as any).isSolo || false;
        const products = (sessionData.session as any).products || [];
        const productSummaries = [];

        // 1. Generate independent summaries for each product
        for (const product of products) {
            console.log(`[AI] Generating summary for product ${product.index}: ${product.productName}`);
            const summary = await generateProductSummary(sessionId, product, isSolo);
            if (summary) productSummaries.push(summary);
        }

        // If no products were defined (legacy or empty), try productIndex 0
        if (products.length === 0) {
            const summary = await generateProductSummary(sessionId, { index: 0, productName: sessionData.session.productName, productType: sessionData.session.productType, productLink: sessionData.session.productLink }, isSolo);
            if (summary) productSummaries.push(summary);
        }

        // 2. Generate comparison if multiple products (skip for solo sessions)
        if (productSummaries.length > 1 && !isSolo) {
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

async function generateProductSummary(sessionId: string, product: any, isSolo: boolean = false) {
    const model = getModel('product', isSolo);
    const messages = await getSessionMessages(sessionId, 1000, product.index);

    if (messages.length === 0) {
        const [saved] = await db.insert(tastingSummaries).values({
            sessionId,
            productIndex: product.index,
            nose: isSolo ? null : 'No aromas recorded.',
            palate: isSolo ? null : 'No flavor notes recorded.',
            finish: isSolo ? null : 'No finish notes recorded.',
            observations: isSolo ? null : 'No messages for this product.',
            metadata: { tags: [], participants: [] },
        }).onConflictDoUpdate({
            target: [tastingSummaries.sessionId, tastingSummaries.productIndex],
            set: { observations: isSolo ? null : 'No messages for this product.', generatedAt: new Date() }
        }).returning();
        emitSummaryGenerated(sessionId, saved.id);
        return saved;
    }

    const transcript = messages.map(m =>
        `${m.user?.displayName || 'Anonymous'} [ID: ${m.user?.id || 'unknown'}]: ${m.message.content}`
    ).join('\n');

    const prompt = isSolo
        ? `
        Analyze this solo tasting session for: ${product.productName || 'Product ' + (product.index + 1)} (${product.productType || 'Unknown'}).
        This is a solo session, so ONLY generate the individual taster summary for the user. 
        DO NOT generate the top-level nose, palate, finish, and observations fields (leave them out of the JSON or null).
        Transcript:
        ${transcript}
        `
        : `
        Analyze this tasting session for: ${product.productName || 'Product ' + (product.index + 1)} (${product.productType || 'Unknown'}).
        Transcript:
        ${transcript}
    `;

    const result = await model.generateContent(prompt);
    const summaryData = JSON.parse(result.response.text());

    const [saved] = await db.insert(tastingSummaries).values({
        sessionId,
        productIndex: product.index,
        ...summaryData,
        metadata: {
            ...summaryData.metadata,
            productDescription: product.productDescription || null
        }
    }).onConflictDoUpdate({
        target: [tastingSummaries.sessionId, tastingSummaries.productIndex],
        set: {
            ...summaryData,
            metadata: {
                ...summaryData.metadata,
                productDescription: product.productDescription || null
            },
            generatedAt: new Date()
        }
    }).returning();

    emitSummaryGenerated(sessionId, saved.id);
    return saved;
}

export async function generateProductDescription(url: string): Promise<string | null> {
    if (!url) return null;
    try {
        console.log(`[AI] Generating product description for URL: ${url}`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        console.log(`[AI] Fetch status: ${response.status} ${response.statusText}`);
        const html = await response.text();
        console.log(`[AI] HTML length: ${html.length}`);
        // Extract text content (strip HTML tags)
        const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 5000);
        console.log(`[AI] Text content length: ${textContent.length}`);

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const prompt = `Write ONE concise sentence (max 40 words) describing this product. Include: name, producer, type, key characteristics. For wine/whisky, add region/vintage if available. Be factual.

Content: ${textContent}`;

        const result = await model.generateContent(prompt);
        const description = result.response.text().trim();
        console.log(`[AI] Generated description: ${description}`);
        return description;
    } catch (error) {
        console.error('[AI] Product description generation failed:', error);
        return null;
    }
}

async function generateComparisonSummary(sessionId: string, productSummaries: any[], products: any[]) {
    const model = getModel('comparison');

    const summariesText = productSummaries.map((s, i) => {
        const p = products.find(p => p.index === s.productIndex) || products[i];
        return `${p.productName}: Nose: ${s.nose}. Palate: ${s.palate}. Finish: ${s.finish}.`;
    }).join('\n');

    const prompt = `
        This is a comparative tasting of ${products.length} products. Based on these summaries, provide a brief 1-2 sentence comparison highlighting key differences and any group preferences.
        
        ${summariesText}
    `;

    const result = await model.generateContent(prompt);
    const comparisonData = JSON.parse(result.response.text());

    return await saveComparisonSummary(sessionId, comparisonData);
}
