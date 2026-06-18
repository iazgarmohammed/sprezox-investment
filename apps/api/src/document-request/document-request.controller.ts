import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { DocumentRequestService } from './document-request.service';
import { CreateDocumentRequestDto } from './dto/create-document-request.dto';
import { ReviewDocumentRequestDto } from './dto/review-document-request.dto';

interface RequestUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('document-request')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentRequestController {
  constructor(private documentRequestService: DocumentRequestService) {}

  @Post()
  @Roles(UserRole.INVESTOR)
  createRequest(@CurrentUser() user: RequestUser, @Body() dto: CreateDocumentRequestDto) {
    return this.documentRequestService.createRequest(user.userId, dto.listingId);
  }

  @Get('mine')
  @Roles(UserRole.INVESTOR)
  getMyRequests(@CurrentUser() user: RequestUser) {
    return this.documentRequestService.getMyRequests(user.userId);
  }

  @Get('mine/for-listing')
  @Roles(UserRole.INVESTOR)
  getMyRequestForListing(@CurrentUser() user: RequestUser, @Query('listingId') listingId: string) {
    return this.documentRequestService.getMyRequestForListing(user.userId, listingId);
  }

  @Get(':id/deck-url')
  @Roles(UserRole.INVESTOR)
  getDeckUrl(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.documentRequestService.getDeckUrlForRequest(user.userId, id);
  }

  @Get('founder')
  @Roles(UserRole.FOUNDER)
  getRequestsForFounder(@CurrentUser() user: RequestUser) {
    return this.documentRequestService.getRequestsForFounder(user.userId);
  }

  @Patch(':id/review')
  @Roles(UserRole.FOUNDER)
  reviewRequest(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ReviewDocumentRequestDto,
  ) {
    return this.documentRequestService.reviewRequest(user.userId, id, dto);
  }
}