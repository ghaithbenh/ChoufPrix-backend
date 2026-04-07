export class QueryProductDto {
    store?: string;
    search?: string;
    category?: string;
    parentCategory?: string;
    subcategory?: string;
    minPrice?: number;
    maxPrice?: number;
    source?: string;
    page?: number;
    limit?: number;
}
