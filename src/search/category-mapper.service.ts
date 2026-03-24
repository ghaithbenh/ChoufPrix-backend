import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TAXONOMY } from '../products/taxonomy';

@Injectable()
export class CategoryMapperService {
    private model: any;

    constructor() {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    async map(productName: string, rawCategory?: string): Promise<{ parent: string; subcategory: string }> {
        const prompt = `You are a product categorization expert for a Tunisian e-commerce price comparison site.
Your goal is to map a product to the most appropriate Parent Category and Subcategory from the predefined taxonomy below.

TAXONOMY:
${JSON.stringify(TAXONOMY, null, 2)}

PRODUCT INFO:
Name: "${productName}"
Raw Scraped Category: "${rawCategory || 'N/A'}"

INSTRUCTIONS:
1. Analyze the product name and raw category to understand what it is.
2. Pick EXACTLY ONE Parent Category and ONE Subcategory from the allowed taxonomy above.
3. If it's ambiguous, pick the most logical fit.
4. If it's "Écran" vs "Télévision", check if it's meant for a PC (Écran) or Home Cinema/TV (Télévision).
5. If it's a "PC Gamer", it MUST go to "Gaming" -> "PC Gamer".
6. Return ONLY a valid JSON object: {"parent": "...", "subcategory": "..."}

Return ONLY JSON, no markdown formatting, no extra text.`;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text().trim();
            const clean = text.replace(/```json|```/g, '').trim();
            return JSON.parse(clean);
        } catch (error) {
            console.error('Gemini Categorization failed, falling back to keywords:', error.message);
            // We'll return a special marker so the caller can fall back to the keyword logic
            return { parent: 'UNKNOWN', subcategory: 'UNKNOWN' };
        }
    }
}
