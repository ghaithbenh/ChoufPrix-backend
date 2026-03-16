import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService {
    constructor(private readonly elasticSearch: ElasticsearchService) { }

    async indexProduct(product: any) {
        await this.elasticSearch.index({
            index: 'products',
            id: product._id.toString(),
            document: {
                name: product.name,
                price: product.price,
                store: product.store,
                description: product.description,
                url: product.url,
                image: product.image,
            }
        });
    }

    async indexAllProducts(products: any[]) {
        const operations = products.flatMap(product => [
            { index: { _index: 'products', _id: product._id.toString() } },
            {
                name: product.name,
                price: product.price,
                store: product.store,
                description: product.description,
                url: product.url,
                image: product.image,
            }
        ]);

        await this.elasticSearch.bulk({ operations });
    }

    async searchProducts(query: string, minPrice?: number, maxPrice?: number) {
        const must: any[] = [
            {
                multi_match: {
                    query,
                    fields: ['name^3', 'description'],
                    fuzziness: 'AUTO'
                }
            }
        ];

        const filter: any[] = [];

        if (minPrice || maxPrice) {
            filter.push({
                range: {
                    price: {
                        ...(minPrice && { gte: Number(minPrice) * 1000 }),
                        ...(maxPrice && { lte: Number(maxPrice) * 1000 })
                    }
                }
            });
        }


        const result = await this.elasticSearch.search({
            index: 'products',
            query: {
                bool: { must, filter }
            }
        });

        return result.hits.hits.map((hit: any) => ({
            ...hit._source,
            score: hit._score
        }));
    }
}