import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { SearchService } from './search.service';
import { EmbeddingService } from './embedding.service';
import { QueryNormalizerService } from './query-normalizer.service';

@Module({
  imports: [
    ElasticsearchModule.register({
      node: 'http://localhost:9200',
    })
  ],
  providers: [SearchService, EmbeddingService, QueryNormalizerService],
  exports: [SearchService, EmbeddingService, QueryNormalizerService],
})
export class SearchModule { }