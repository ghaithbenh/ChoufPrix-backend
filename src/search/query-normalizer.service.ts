import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class QueryNormalizerService {
    private model: any;

    constructor() {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    async normalize(query: string): Promise<{
        product: string;
        category: string;
        specs: string[];
        intent: string;
        normalizedQuery: string;
    }> {
        const prompt = `You are a Tunisian shopping assistant for a price comparison website.
The user may type in Tunisian dialect (Derja), Arabic, French, or English — or a mix of all.
Extract a structured search object from their query.

Examples:
Input: "Nlawej 3la pc gaming rkhis fih rtx 3050"
Output: {"product": "laptop", "category": "gaming", "specs": ["RTX 3050"], "intent": "budget_friendly", "normalizedQuery": "PC portable gaming pas cher RTX 3050"}

Input: "A3tini un smartphone bakou b'a9al men 800dt"
Output: {"product": "smartphone", "category": "mobile", "specs": ["neuf"], "intent": "budget_friendly", "normalizedQuery": "smartphone neuf moins de 800 DT"}

Input: "pc portable pour etudiant pas cher"
Output: {"product": "laptop", "category": "student", "specs": [], "intent": "budget_friendly", "normalizedQuery": "PC portable étudiant pas cher"}

Input: "chasi5 mte3 design"
Output: {"product": "laptop", "category": "design", "specs": [], "intent": "performance", "normalizedQuery": "PC portable puissant pour design graphique"}

IMPORTANT: Return ONLY valid JSON, no extra text.

User query: "${query}"`;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text().trim();
            const clean = text.replace(/```json|```/g, '').trim();
            return JSON.parse(clean);
        } catch {
            // Fallback if Gemini fails
            return {
                product: query,
                category: 'general',
                specs: [],
                intent: 'general',
                normalizedQuery: query
            };
        }
    }
}