import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { ReviewListingDto } from './dto/review-listing.dto';
import { SetUserActiveDto } from './dto/set-user-active.dto';

interface RequestUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardCounts();
  }

  @Get('listings/pending')
  getPendingListings() {
    return this.adminService.getPendingListings();
  }

  @Get('listings/:id/deck-url')
  getListingDeckUrl(@Param('id') id: string) {
    return this.adminService.getListingDeckUrl(id);
  }

  @Post('listings/:id/review')
  reviewListing(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ReviewListingDto,
  ) {
    return this.adminService.reviewListing(user.userId, id, dto);
  }

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Patch('users/:id/active')
  setUserActiveStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: SetUserActiveDto,
  ) {
    return this.adminService.setUserActiveStatus(user.userId, id, dto.isActive);
  }

  @Get('activity-log')
  getActivityLog() {
    return this.adminService.getActivityLog();
  }
}