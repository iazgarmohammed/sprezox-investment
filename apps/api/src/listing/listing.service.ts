import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ListingStatus, ActivityEventType, RequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { UpsertListingDto } from './dto/upsert-listing.dto';
import { BrowseListingsDto } from './dto/browse-listings.dto';

const ACTIVE_STATUSES: ListingStatus[] = [
  ListingStatus.Draft,
  ListingStatus.Pending,
  ListingStatus.Live,
];

@Injectable()
export class ListingService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private activityLogService: ActivityLogService,
  ) {}

  async getMyListing(founderId: string) {
    const startup = await this.getOwnedStartup(founderId);

    return this.prisma.fundraisingListing.findFirst({
      where: { startupId: startup.id, status: { in: ACTIVE_STATUSES } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertMyListing(founderId: string, dto: UpsertListingDto) {
    const startup = await this.getOwnedStartup(founderId);

    const existing = await this.prisma.fundraisingListing.findFirst({
      where: { startupId: startup.id, status: { in: ACTIVE_STATUSES } },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      if (existing.status !== ListingStatus.Draft) {
        throw new ConflictException(
          'You already have an active listing. Edit it directly or wait for it to close before creating a new one.',
        );
      }

      return this.prisma.fundraisingListing.update({
        where: { id: existing.id },
        data: {
          roundType: dto.roundType,
          targetAmountInr: BigInt(dto.targetAmountInr),
          instrument: dto.instrument,
          useOfFunds: dto.useOfFunds,
          tractionHighlights: dto.tractionHighlights,
        },
      });
    }

    return this.prisma.fundraisingListing.create({
      data: {
        startupId: startup.id,
        roundType: dto.roundType,
        targetAmountInr: BigInt(dto.targetAmountInr),
        instrument: dto.instrument,
        useOfFunds: dto.useOfFunds,
        tractionHighlights: dto.tractionHighlights,
        status: ListingStatus.Draft,
      },
    });
  }

  async uploadPitchDeck(
    founderId: string,
    file: { originalname: string; buffer: Buffer; mimetype: string },
  ) {
    const startup = await this.getOwnedStartup(founderId);

    const listing = await this.prisma.fundraisingListing.findFirst({
      where: { startupId: startup.id, status: { in: ACTIVE_STATUSES } },
      orderBy: { createdAt: 'desc' },
    });

    if (!listing) {
      throw new NotFoundException('Create your listing before uploading a pitch deck');
    }

    if (listing.status !== ListingStatus.Draft) {
      throw new ConflictException('Cannot replace pitch deck after submission');
    }

    const pitchDeckUrl = await this.storageService.uploadPrivateFile('pitch-decks', file);

    return this.prisma.fundraisingListing.update({
      where: { id: listing.id },
      data: { pitchDeckUrl },
    });
  }

  async submitForReview(founderId: string) {
    const startup = await this.getOwnedStartup(founderId);

    const listing = await this.prisma.fundraisingListing.findFirst({
      where: { startupId: startup.id, status: { in: ACTIVE_STATUSES } },
      orderBy: { createdAt: 'desc' },
    });

    if (!listing) {
      throw new NotFoundException('Create a listing before submitting it for review');
    }

    if (listing.status !== ListingStatus.Draft) {
      throw new ConflictException('This listing has already been submitted');
    }

    if (!listing.pitchDeckUrl) {
      throw new BadRequestException('Upload a pitch deck before submitting for review');
    }

    const updated = await this.prisma.fundraisingListing.update({
      where: { id: listing.id },
      data: {
        status: ListingStatus.Pending,
        submittedAt: new Date(),
      },
    });

    await this.activityLogService.log(
      founderId,
      ActivityEventType.LISTING_SUBMITTED,
      updated.id,
    );

    return updated;
  }

  async getMyDashboard(founderId: string) {
    const startup = await this.prisma.startup.findFirst({ where: { founderId } });

    if (!startup) {
      return {
        hasStartup: false,
        listing: null,
        documentRequestCounts: { pending: 0, approved: 0, declined: 0 },
        connectionRequestCounts: { pending: 0, approved: 0, declined: 0 },
      };
    }

    const listing = await this.prisma.fundraisingListing.findFirst({
      where: { startupId: startup.id, status: { in: ACTIVE_STATUSES } },
      orderBy: { createdAt: 'desc' },
    });

    if (!listing) {
      return {
        hasStartup: true,
        listing: null,
        documentRequestCounts: { pending: 0, approved: 0, declined: 0 },
        connectionRequestCounts: { pending: 0, approved: 0, declined: 0 },
      };
    }

    const [docCounts, connCounts] = await Promise.all([
      this.countByStatus('documentRequest', listing.id),
      this.countByStatus('connectionRequest', listing.id),
    ]);

    return {
      hasStartup: true,
      listing: {
        id: listing.id,
        roundType: listing.roundType,
        targetAmountInr: listing.targetAmountInr.toString(),
        instrument: listing.instrument,
        status: listing.status,
        investorCount: listing.investorCount,
        investorCap: listing.investorCap,
        submittedAt: listing.submittedAt,
        publishedAt: listing.publishedAt,
        adminNote: listing.adminNote,
      },
      documentRequestCounts: docCounts,
      connectionRequestCounts: connCounts,
    };
  }

  async browseListings(dto: BrowseListingsDto) {
    const limit = dto.limit ?? 12;

    const listings = await this.prisma.fundraisingListing.findMany({
      where: {
        status: ListingStatus.Live,
        startup: {
          ...(dto.sector ? { sector: dto.sector } : {}),
          ...(dto.stage ? { stage: dto.stage } : {}),
        },
        ...(dto.roundType ? { roundType: dto.roundType } : {}),
      },
      take: limit + 1,
      ...(dto.cursor ? { cursor: { id: dto.cursor }, skip: 1 } : {}),
      orderBy: { publishedAt: 'desc' },
      include: {
        startup: {
          select: {
            id: true,
            name: true,
            slug: true,
            sector: true,
            stage: true,
            oneLiner: true,
            logoUrl: true,
            location: true,
          },
        },
      },
    });

    const hasMore = listings.length > limit;
    const page = hasMore ? listings.slice(0, limit) : listings;

    return {
      items: page.map((l) => ({
        id: l.id,
        roundType: l.roundType,
        targetAmountInr: l.targetAmountInr.toString(),
        instrument: l.instrument,
        investorCount: l.investorCount,
        investorCap: l.investorCap,
        publishedAt: l.publishedAt,
        startup: l.startup,
      })),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  async getListingDetail(listingId: string) {
    const listing = await this.prisma.fundraisingListing.findUnique({
      where: { id: listingId },
      include: {
        startup: {
          select: {
            id: true,
            name: true,
            slug: true,
            sector: true,
            stage: true,
            oneLiner: true,
            description: true,
            logoUrl: true,
            websiteUrl: true,
            location: true,
            teamSize: true,
          },
        },
      },
    });

    if (!listing || listing.status !== ListingStatus.Live) {
      throw new NotFoundException('Listing not found');
    }

    // Increment view count (fire-and-forget is fine for MVP, but we await for correctness)
    await this.prisma.startup.update({
      where: { id: listing.startup.id },
      data: { viewCount: { increment: 1 } },
    });

    return {
      id: listing.id,
      roundType: listing.roundType,
      targetAmountInr: listing.targetAmountInr.toString(),
      instrument: listing.instrument,
      useOfFunds: listing.useOfFunds,
      tractionHighlights: listing.tractionHighlights,
      investorCount: listing.investorCount,
      investorCap: listing.investorCap,
      publishedAt: listing.publishedAt,
      startup: listing.startup,
    };
  }

  private async countByStatus(
    model: 'documentRequest' | 'connectionRequest',
    listingId: string,
  ) {
    const [pending, approved, declined] = await Promise.all([
      (this.prisma[model] as any).count({ where: { listingId, status: RequestStatus.Pending } }),
      (this.prisma[model] as any).count({ where: { listingId, status: RequestStatus.Approved } }),
      (this.prisma[model] as any).count({ where: { listingId, status: RequestStatus.Declined } }),
    ]);

    return { pending, approved, declined };
  }

  private async getOwnedStartup(founderId: string) {
    const startup = await this.prisma.startup.findFirst({ where: { founderId } });

    if (!startup) {
      throw new NotFoundException('Create your startup profile before creating a listing');
    }

    return startup;
  }
}