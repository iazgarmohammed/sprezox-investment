import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { ConnectionRequestService } from './connection-request.service';
import { CreateConnectionRequestDto } from './dto/create-connection-request.dto';
import { ReviewConnectionRequestDto } from './dto/review-connection-request.dto';

interface RequestUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('connection-request')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConnectionRequestController {
  constructor(private connectionRequestService: ConnectionRequestService) {}

  @Post()
  @Roles(UserRole.INVESTOR)
  createRequest(@CurrentUser() user: RequestUser, @Body() dto: CreateConnectionRequestDto) {
    return this.connectionRequestService.createRequest(user.userId, dto);
  }

  @Get('mine')
  @Roles(UserRole.INVESTOR)
  getMyRequests(@CurrentUser() user: RequestUser) {
    return this.connectionRequestService.getMyRequests(user.userId);
  }

  @Get('mine/for-listing')
  @Roles(UserRole.INVESTOR)
  getMyRequestForListing(@CurrentUser() user: RequestUser, @Query('listingId') listingId: string) {
    return this.connectionRequestService.getMyRequestForListing(user.userId, listingId);
  }

  @Get('founder')
  @Roles(UserRole.FOUNDER)
  getRequestsForFounder(@CurrentUser() user: RequestUser) {
    return this.connectionRequestService.getRequestsForFounder(user.userId);
  }

  @Patch(':id/review')
  @Roles(UserRole.FOUNDER)
  reviewRequest(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ReviewConnectionRequestDto,
  ) {
    return this.connectionRequestService.reviewRequest(user.userId, id, dto);
  }
}