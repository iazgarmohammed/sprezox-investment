import { Module } from '@nestjs/common';
import { DocumentRequestController } from './document-request.controller';
import { DocumentRequestService } from './document-request.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [DocumentRequestController],
  providers: [DocumentRequestService],
})
export class DocumentRequestModule {}