import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { InvestorProfileService } from './investor-profile.service';
import { UpsertInvestorProfileDto } from './dto/upsert-investor-profile.dto';

interface RequestUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('investor-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.INVESTOR)
export class InvestorProfileController {
  constructor(private investorProfileService: InvestorProfileService) {}

  @Get('me')
  getMyProfile(@CurrentUser() user: RequestUser) {
    return this.investorProfileService.getMyProfile(user.userId);
  }

  @Put('me')
  upsertMyProfile(@CurrentUser() user: RequestUser, @Body() dto: UpsertInvestorProfileDto) {
    return this.investorProfileService.upsertMyProfile(user.userId, dto);
  }
}