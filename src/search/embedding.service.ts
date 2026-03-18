import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class EmbeddingService implements OnModuleInit {
    private extractor: any;

    async onModuleInit() {
        const { pipeline } = await import('@xenova/transformers');
        this.extractor = await pipeline(
            'feature-extraction',
            'Xenova/multilingual-e5-small'
        );
        console.log('Embedding model loaded');
    }

    async embed(text: string): Promise<number[]> {
        const output = await this.extractor(text, {
            pooling: 'mean',
            normalize: true
        });
        return Array.from(output.data);
    }
}