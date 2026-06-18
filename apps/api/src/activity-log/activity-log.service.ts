import { Injectable } from '@nestjs/common';
import { ActivityEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  async log(
    actorId: string,
    eventType: ActivityEventType,
    targetId?: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.prisma.activityLog.create({
      data: {
        actorId,
        eventType,
        targetId,
        metadata,
      },
    });
  }
}