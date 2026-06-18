import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { FounderProfileModule } from './founder-profile/founder-profile.module';
import { StartupModule } from './startup/startup.module';
import { ListingModule } from './listing/listing.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { AdminModule } from './admin/admin.module';
import { InvestorProfileModule } from './investor-profile/investor-profile.module';
import { DocumentRequestModule } from './document-request/document-request.module';
import { ConnectionRequestModule } from './connection-request/connection-request.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MailModule,
    AuthModule,
    FounderProfileModule,
    StartupModule,
    ListingModule,
    ActivityLogModule,
    AdminModule,
    InvestorProfileModule,
    DocumentRequestModule,
    ConnectionRequestModule,
  ],
})
export class AppModule {}