import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UpsertStartupDto } from './dto/upsert-startup.dto';

@Injectable()
export class StartupService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  /** Founder MVP assumption: one startup per founder */
  async getMyStartup(founderId: string) {
    return this.prisma.startup.findFirst({ where: { founderId } });
  }

  async upsertMyStartup(founderId: string, dto: UpsertStartupDto) {
    const existing = await this.prisma.startup.findFirst({ where: { founderId } });

    if (existing) {
      return this.prisma.startup.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          sector: dto.sector,
          stage: dto.stage,
          oneLiner: dto.oneLiner,
          description: dto.description,
          websiteUrl: dto.websiteUrl,
          location: dto.location,
          teamSize: dto.teamSize,
        },
      });
    }

    const slug = await this.generateUniqueSlug(dto.name);

    return this.prisma.startup.create({
      data: {
        founderId,
        name: dto.name,
        slug,
        sector: dto.sector,
        stage: dto.stage,
        oneLiner: dto.oneLiner,
        description: dto.description,
        websiteUrl: dto.websiteUrl,
        location: dto.location,
        teamSize: dto.teamSize,
      },
    });
  }

  async uploadLogo(
    founderId: string,
    file: { originalname: string; buffer: Buffer; mimetype: string },
  ) {
    const startup = await this.prisma.startup.findFirst({ where: { founderId } });

    if (!startup) {
      throw new NotFoundException('Create your startup profile before uploading a logo');
    }

    const logoUrl = await this.storageService.uploadFile('logos', file);

    return this.prisma.startup.update({
      where: { id: startup.id },
      data: { logoUrl },
    });
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let slug = base;
    let counter = 1;

    while (await this.prisma.startup.findUnique({ where: { slug } })) {
      slug = `${base}-${counter}`;
      counter++;
    }

    return slug;
  }
}