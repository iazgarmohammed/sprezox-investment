import { Module } from '@nestjs/common';
import { StartupController } from './startup.controller';
import { StartupService } from './startup.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [StartupController],
  providers: [StartupService],
})
export class StartupModule {}