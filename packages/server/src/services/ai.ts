import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { db, tastingSummaries } from '../db/index.js';
import { getSessionMessages } from './messages.js';
import { getSession } from './sessions.js';
import { emitSummaryGenerated } from '../sockets/socketManager.js';

// Helper to get model
function getModel() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    return genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
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
            },
        },
    });
}

export async function generateSessionSummary(sessionId: string) {
    try {
        const model = getModel();
        console.log(`[AI] Generating summary for session ${sessionId}...`);
        console.log(`[AI] API Key present: ${!!process.env.GEMINI_API_KEY}`);

        // 1. Fetch session data
        const sessionData = await getSession(sessionId);
        if (!sessionData) {
            throw new Error('Session not found');
        }

        // 2. Fetch messages
        const messages = await getSessionMessages(sessionId, 1000); // Fetch up to 1000 messages
        if (messages.length === 0) {
            console.log('[AI] No messages to summarize. Creating placeholder.');
            const [savedSummary] = await db
                .insert(tastingSummaries)
                .values({
                    sessionId,
                    nose: 'No aromas recorded.',
                    palate: 'No flavor notes recorded.',
                    finish: 'No finish notes recorded.',
                    observations: 'This session ended without any recorded tasting notes.',
                    metadata: { tags: [], participants: [] },
                })
                .onConflictDoUpdate({
                    target: tastingSummaries.sessionId,
                    set: {
                        observations: 'This session ended without any recorded tasting notes.',
                        generatedAt: new Date(),
                    },
                })
                .returning();
            return savedSummary;
        }

        // 3. Construct Prompt
        const participants = messages.reduce((acc: any[], m) => {
            if (m.user && !acc.find(u => u.id === m.user?.id)) {
                acc.push({ id: m.user.id, name: m.user.displayName });
            }
            return acc;
        }, []);

        const participantMapping = participants
            .map(p => `- ${p.name} (ID: ${p.id})`)
            .join('\n');

        const transcript = messages
            .map(
                (m) =>
                    `${m.user?.displayName || 'Anonymous'} [ID: ${m.user?.id || 'unknown'}] (${new Date(m.message.createdAt).toLocaleTimeString()}): ${m.message.content}`
            )
            .join('\n');

        const productInfo = sessionData.session.productName
            ? `"${sessionData.session.productName}" (${sessionData.session.productType || 'Unknown Type'})`
            : `"${sessionData.session.name}" (${sessionData.session.productType || 'Unknown Type'})`;

        const productLinkContext = sessionData.session.productLink
            ? `Product Link: ${sessionData.session.productLink}`
            : '';

        const prompt = `
      You are an expert sommelier and tasting assistant.
      Analyze the following chat transcript from a collaborative tasting session of ${productInfo}.
      ${productLinkContext}

      Participants:
      ${participantMapping}

      Your goal is to synthesize the group's discussion into a structured tasting note.
      
      Extract and synthesize:
      1. Overall Summary:
         - Nose: Aromas mentioned by the group.
         - Palate: Flavors and textures mentioned by the group.
         - Finish: Aftertaste and length mentioned by the group.
         - Observations: General impressions, color, age, etc.
      
      2. Individual Taster Summaries:
         - For EACH participant who contributed meaningful notes, provide a structured summary (Nose, Palate, Finish, Observations) based ONLY on their specific contributions.
         - Use the EXACT User IDs provided in the mapping for the 'userId' field in the response.
      
      3. Metadata:
         - Tags: Key descriptors (e.g., "Oaky", "Fruity", "Tannic").
         - Participants: List of names of people who contributed meaningful notes.

      Transcript:
      ${transcript}
    `;

        // 4. Call Gemini
        const result = await model.generateContent(prompt);
        const response = result.response;
        const jsonString = response.text();
        const summaryData = JSON.parse(jsonString);

        console.log('[AI] Summary generated successfully');

        // 5. Save to Database
        const [savedSummary] = await db
            .insert(tastingSummaries)
            .values({
                sessionId,
                nose: summaryData.nose,
                palate: summaryData.palate,
                finish: summaryData.finish,
                observations: summaryData.observations,
                tasterSummaries: summaryData.tasterSummaries,
                metadata: summaryData.metadata,
            })
            .onConflictDoUpdate({
                target: tastingSummaries.sessionId,
                set: {
                    nose: summaryData.nose,
                    palate: summaryData.palate,
                    finish: summaryData.finish,
                    observations: summaryData.observations,
                    tasterSummaries: summaryData.tasterSummaries,
                    metadata: summaryData.metadata,
                    generatedAt: new Date(),
                },
            })
            .returning();

        // Emit event that summary is ready
        emitSummaryGenerated(sessionId, savedSummary.id);

        return savedSummary;
    } catch (error: any) {
        console.error('[AI] Failed to generate summary:', error);
        if (error.response) {
            console.error('[AI] Gemini Error Response:', await error.response.text());
        }
        // Don't throw, just log. We don't want to break the "End Session" flow if AI fails.
        return null;
    }
}
