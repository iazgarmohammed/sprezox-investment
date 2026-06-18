import {
  Body,
  Controller,
  Get,
  Put,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Multer } from 'multer';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { StartupService } from './startup.service';
import { UpsertStartupDto } from './dto/upsert-startup.dto';

interface RequestUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('startup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.FOUNDER)
export class StartupController {
  constructor(private startupService: StartupService) {}

  @Get('me')
  getMyStartup(@CurrentUser() user: RequestUser) {
    return this.startupService.getMyStartup(user.userId);
  }

  @Put('me')
  upsertMyStartup(@CurrentUser() user: RequestUser, @Body() dto: UpsertStartupDto) {
    return this.startupService.upsertMyStartup(user.userId, dto);
  }

  @Post('me/logo')
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(
    @CurrentUser() user: RequestUser,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ })
        .addMaxSizeValidator({ maxSize: 2 * 1024 * 1024 }) // 2MB
        .build({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    file: Express.Multer.File,
  ) {
    return this.startupService.uploadLogo(user.userId, file);
  }
}