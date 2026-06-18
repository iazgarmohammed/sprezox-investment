import {
  Body,
  Controller,
  Get,
  Put,
  Post,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { ListingService } from './listing.service';
import { UpsertListingDto } from './dto/upsert-listing.dto';
import { BrowseListingsDto } from './dto/browse-listings.dto';

interface RequestUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('listing')
export class ListingController {
  constructor(private listingService: ListingService) {}

  // PUBLIC - no guard
  @Get('browse')
  browseListings(@Query() dto: BrowseListingsDto) {
    return this.listingService.browseListings(dto);
  }

  // PUBLIC - no guard. Must come AFTER 'browse' route to avoid ':id' matching it.
  @Get('browse/:id')
  getListingDetail(@Param('id') id: string) {
    return this.listingService.getListingDetail(id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FOUNDER)
  getMyListing(@CurrentUser() user: RequestUser) {
    return this.listingService.getMyListing(user.userId);
  }

  @Get('me/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FOUNDER)
  getMyDashboard(@CurrentUser() user: RequestUser) {
    return this.listingService.getMyDashboard(user.userId);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FOUNDER)
  upsertMyListing(@CurrentUser() user: RequestUser, @Body() dto: UpsertListingDto) {
    return this.listingService.upsertMyListing(user.userId, dto);
  }

  @Post('me/pitch-deck')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FOUNDER)
  @UseInterceptors(FileInterceptor('file'))
  uploadPitchDeck(
    @CurrentUser() user: RequestUser,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /(pdf)$/ })
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 }) // 10MB
        .build({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    file: Express.Multer.File,
  ) {
    return this.listingService.uploadPitchDeck(user.userId, file);
  }

  @Post('me/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FOUNDER)
  submitForReview(@CurrentUser() user: RequestUser) {
    return this.listingService.submitForReview(user.userId);
  }
}