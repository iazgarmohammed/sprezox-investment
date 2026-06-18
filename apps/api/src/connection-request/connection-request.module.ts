import { Module } from '@nestjs/common';
import { ConnectionRequestController } from './connection-request.controller';
import { ConnectionRequestService } from './connection-request.service';

import { MailModule } from '../mail/mail.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [
    MailModule,
    ActivityLogModule,
  ],
  controllers: [ConnectionRequestController],
  providers: [ConnectionRequestService],
})
export class ConnectionRequestModule {}