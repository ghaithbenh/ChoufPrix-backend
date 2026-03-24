import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { EmbeddingService } from './embedding.service';
import { QueryNormalizerService } from './query-normalizer.service';
import { CategoryMapperService } from './category-mapper.service';

@Injectable()
export class SearchService {
    constructor(
        private readonly elasticSearch: ElasticsearchService,
        private readonly embeddingService: EmbeddingService,
        private readonly queryNormalizerService: QueryNormalizerService,
        private readonly categoryMapper: CategoryMapperService,
    ) { }

    async indexProduct(product: any) {
        const embedding = await this.embeddingService.embed(
            `${product.name} ${product.description || ''}`
        );

        // AI Categorization if missing or UNKNOWN
        let parent = product.parentCategory;
        let sub = product.subcategory;
        if (!parent || parent === 'Électroménager & Autres' || parent === 'UNKNOWN') {
            const mapped = await this.categoryMapper.map(product.name, product.category);
            if (mapped.parent !== 'UNKNOWN') {
                parent = mapped.parent;
                sub = mapped.subcategory;
            }
        }

        await this.elasticSearch.index({
            index: 'products',
            id: product._id.toString(),
            document: {
                name: product.name,
                price: product.price,
                store: product.store,
                category: product.category,
                parentCategory: parent,
                subcategory: sub,
                description: product.description,
                url: product.url,
                image: product.image,
                embedding,
            }
        });
    }

    async indexAllProducts(products: any[]) {
        console.log(`Indexing ${products.length} products with embeddings...`);

        for (const product of products) {
            const embedding = await this.embeddingService.embed(
                `${product.name} ${product.description || ''}`
            );

            // AI Categorization if missing or UNKNOWN
            let parent = product.parentCategory;
            let sub = product.subcategory;
            if (!parent || parent === 'Électroménager & Autres' || parent === 'UNKNOWN') {
                const mapped = await this.categoryMapper.map(product.name, product.category);
                if (mapped.parent !== 'UNKNOWN') {
                    parent = mapped.parent;
                    sub = mapped.subcategory;
                }
            }

            await this.elasticSearch.bulk({
                operations: [
                    { index: { _index: 'products', _id: product._id.toString() } },
                    {
                        name: product.name,
                        price: product.price,
                        store: product.store,
                        category: product.category,
                        parentCategory: parent,
                        subcategory: sub,
                        description: product.description,
                        url: product.url,
                        image: product.image,
                        embedding,
                    }
                ]
            });
        }

        console.log('Indexing complete!');
    }

    async searchProducts(query: string, minPrice?: number, maxPrice?: number, category?: string, parentCategory?: string, subcategory?: string) {
        // Step 1: Normalize with Gemini
        const normalized = await this.queryNormalizerService.normalize(query);
        console.log(`Original: "${query}"`);
        console.log(`Normalized:`, normalized);

        const filter: any[] = [];
        const min = minPrice !== undefined ? Number(minPrice) : undefined;
        const max = maxPrice !== undefined ? Number(maxPrice) : undefined;

        if (min !== undefined || max !== undefined) {
            filter.push({
                range: {
                    price: {
                        ...(min !== undefined && { gte: min }),
                        ...(max !== undefined && { lte: max })
                    }
                }
            });
        }

        if (category) {
            filter.push({ term: { category: category } });
        }

        if (parentCategory) {
            filter.push({ term: { parentCategory: parentCategory } });
        }

        if (subcategory) {
            filter.push({ term: { subcategory: subcategory } });
        }

        // Step 2: Embed the normalized query
        try {
            const queryEmbedding = await this.embeddingService.embed(
                normalized.normalizedQuery
            );

            // Step 3: Vector search in Elasticsearch
            const result = await this.elasticSearch.search({
                index: 'products',
                knn: {
                    field: 'embedding',
                    query_vector: queryEmbedding,
                    k: 20,
                    num_candidates: 100,
                    filter: filter.length > 0 ? { bool: { filter } } : undefined,
                },
            });

            return {
                normalized,
                results: result.hits.hits.map((hit: any) => ({
                    ...hit._source,
                    score: hit._score
                }))
            };
        } catch {
            // Fallback to keyword search
            const result = await this.elasticSearch.search({
                index: 'products',
                query: {
                    bool: {
                        must: [{
                            multi_match: {
                                query: normalized.normalizedQuery,
                                fields: ['name^3', 'description'],
                                fuzziness: 'AUTO'
                            }
                        }],
                        filter
                    }
                }
            });

            return {
                normalized,
                results: result.hits.hits.map((hit: any) => ({
                    ...hit._source,
                    score: hit._score
                }))
            };
        }
    }
}