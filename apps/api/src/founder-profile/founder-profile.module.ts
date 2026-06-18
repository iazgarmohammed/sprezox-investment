import { Module } from '@nestjs/common';
import { FounderProfileController } from './founder-profile.controller';
import { FounderProfileService } from './founder-profile.service';

@Module({
  controllers: [FounderProfileController],
  providers: [FounderProfileService],
})
export class FounderProfileModule {}