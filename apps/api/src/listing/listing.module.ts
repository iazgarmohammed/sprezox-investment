import { Module } from '@nestjs/common';
import { ListingController } from './listing.controller';
import { ListingService } from './listing.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [ListingController],
  providers: [ListingService],
})
export class ListingModule {}