import { Injectable, Logger } from '@nestjs/common';
import { SearchService } from '../search/search.service';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(private readonly searchService: SearchService) {}

  async processMessage(message: string, city?: string) {
    const normalizedMessage = message.trim().toLowerCase();

    try {
      const searchRes = await this.searchService.searchProducts(normalizedMessage);
      const topResults = (searchRes?.results || []).slice(0, 3);
      
      let finalQuery = normalizedMessage;
      if (city && city.trim()) {
        finalQuery = `${normalizedMessage} ${city.trim()}`;
      }

      const encodedQuery = encodeURIComponent(finalQuery);
      const facebookLink = `https://www.facebook.com/marketplace/search/?query=${encodedQuery}`;
      const tayaraLink = `https://www.tayara.tn/search/?q=${encodedQuery}`;

      let responseString = '';
      if (topResults.length > 0) {
        responseString = 'Here are the most relevant products from our store:\n\n';
        responseString += topResults.map((p: any) => 
          `${p.name} - Price: ${p.price} DT - URL: ${p.url}`
        ).join('\n\n');
        responseString += '\n\nYou can also check external marketplaces below:';
      } else {
        responseString = `No internal products found. Here are some external search links for "${normalizedMessage}":`;
      }

      return {
        message: responseString,
        products: topResults.map((p: any) => ({
            name: p.name,
            price: p.price,
            image: p.image,
            url: p.url
        })),
        links: {
          facebook: facebookLink,
          tayara: tayaraLink,
        }
      };

    } catch (error) {
      this.logger.error('Error fetching vector search products', error);
      return {
        message: 'An error occurred while searching for products.',
        products: []
      };
    }
  }
}
