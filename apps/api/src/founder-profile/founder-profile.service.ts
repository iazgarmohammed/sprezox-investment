import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertFounderProfileDto } from './dto/upsert-founder-profile.dto';

@Injectable()
export class FounderProfileService {
  constructor(private prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const profile = await this.prisma.founderProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return null;
    }

    return profile;
  }

  async upsertMyProfile(userId: string, dto: UpsertFounderProfileDto) {
    return this.prisma.founderProfile.upsert({
      where: { userId },
      create: {
        userId,
        fullName: dto.fullName,
        bio: dto.bio,
        linkedinUrl: dto.linkedinUrl,
        avatarUrl: dto.avatarUrl,
      },
      update: {
        fullName: dto.fullName,
        bio: dto.bio,
        linkedinUrl: dto.linkedinUrl,
        avatarUrl: dto.avatarUrl,
      },
    });
  }
}