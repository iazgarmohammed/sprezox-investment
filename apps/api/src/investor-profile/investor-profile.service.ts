import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertInvestorProfileDto } from './dto/upsert-investor-profile.dto';

@Injectable()
export class InvestorProfileService {
  constructor(private prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const profile = await this.prisma.investorProfile.findUnique({ where: { userId } });

    if (!profile) {
      return null;
    }

    return {
      ...profile,
      minChequeSizeInr: profile.minChequeSizeInr?.toString() ?? null,
      maxChequeSizeInr: profile.maxChequeSizeInr?.toString() ?? null,
    };
  }

  async upsertMyProfile(userId: string, dto: UpsertInvestorProfileDto) {
    const data = {
      fullName: dto.fullName,
      bio: dto.bio,
      investmentThesis: dto.investmentThesis,
      minChequeSizeInr: dto.minChequeSizeInr !== undefined ? BigInt(dto.minChequeSizeInr) : undefined,
      maxChequeSizeInr: dto.maxChequeSizeInr !== undefined ? BigInt(dto.maxChequeSizeInr) : undefined,
      sectors: dto.sectors ?? [],
      stages: dto.stages ?? [],
      linkedinUrl: dto.linkedinUrl,
    };

    const profile = await this.prisma.investorProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    return {
      ...profile,
      minChequeSizeInr: profile.minChequeSizeInr?.toString() ?? null,
      maxChequeSizeInr: profile.maxChequeSizeInr?.toString() ?? null,
    };
  }
}