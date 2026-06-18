import { Module } from '@nestjs/common';
import { InvestorProfileController } from './investor-profile.controller';
import { InvestorProfileService } from './investor-profile.service';

@Module({
  controllers: [InvestorProfileController],
  providers: [InvestorProfileService],
})
export class InvestorProfileModule {}