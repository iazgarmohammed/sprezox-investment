import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { FounderProfileService } from './founder-profile.service';
import { UpsertFounderProfileDto } from './dto/upsert-founder-profile.dto';

interface RequestUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('founder-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.FOUNDER)
export class FounderProfileController {
  constructor(private founderProfileService: FounderProfileService) {}

  @Get('me')
  getMyProfile(@CurrentUser() user: RequestUser) {
    return this.founderProfileService.getMyProfile(user.userId);
  }

  @Put('me')
  upsertMyProfile(@CurrentUser() user: RequestUser, @Body() dto: UpsertFounderProfileDto) {
    return this.founderProfileService.upsertMyProfile(user.userId, dto);
  }
}