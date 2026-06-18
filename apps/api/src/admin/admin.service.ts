import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ListingStatus, ActivityEventType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ReviewListingDto, ReviewDecision } from './dto/review-listing.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private activityLogService: ActivityLogService,
  ) {}

  async getDashboardCounts() {
    const [totalUsers, totalFounders, totalInvestors, totalStartups, pendingListings, liveListings] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: 'FOUNDER' } }),
        this.prisma.user.count({ where: { role: 'INVESTOR' } }),
        this.prisma.startup.count(),
        this.prisma.fundraisingListing.count({ where: { status: ListingStatus.Pending } }),
        this.prisma.fundraisingListing.count({ where: { status: ListingStatus.Live } }),
      ]);

    return {
      totalUsers,
      totalFounders,
      totalInvestors,
      totalStartups,
      pendingListings,
      liveListings,
    };
  }

  async getPendingListings() {
    const listings = await this.prisma.fundraisingListing.findMany({
      where: { status: ListingStatus.Pending },
      orderBy: { submittedAt: 'asc' },
      include: {
        startup: {
          select: { name: true, sector: true, stage: true, oneLiner: true, founderId: true },
        },
      },
    });

    return listings.map((l) => ({
      id: l.id,
      roundType: l.roundType,
      targetAmountInr: l.targetAmountInr.toString(),
      instrument: l.instrument,
      useOfFunds: l.useOfFunds,
      tractionHighlights: l.tractionHighlights,
      submittedAt: l.submittedAt,
      startup: l.startup,
    }));
  }

  async getListingDeckUrl(listingId: string) {
    const listing = await this.prisma.fundraisingListing.findUnique({ where: { id: listingId } });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (!listing.pitchDeckUrl) {
      throw new NotFoundException('This listing has no pitch deck');
    }

    const signedUrl = await this.storageService.getSignedUrl(listing.pitchDeckUrl, 300);
    return { signedUrl };
  }

  async reviewListing(adminId: string, listingId: string, dto: ReviewListingDto) {
    const listing = await this.prisma.fundraisingListing.findUnique({ where: { id: listingId } });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.status !== ListingStatus.Pending) {
      throw new ConflictException('Only pending listings can be reviewed');
    }

    if (dto.decision === ReviewDecision.APPROVE) {
      const updated = await this.prisma.fundraisingListing.update({
        where: { id: listingId },
        data: {
          status: ListingStatus.Live,
          publishedAt: new Date(),
          adminNote: null,
        },
      });

      await this.activityLogService.log(adminId, ActivityEventType.LISTING_APPROVED, listingId);

      return updated;
    }

    const updated = await this.prisma.fundraisingListing.update({
      where: { id: listingId },
      data: {
        status: ListingStatus.Rejected,
        adminNote: dto.adminNote,
      },
    });

    await this.activityLogService.log(adminId, ActivityEventType.LISTING_REJECTED, listingId, {
      reason: dto.adminNote,
    });

    return updated;
  }

  async getUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        founderProfile: { select: { fullName: true } },
        investorProfile: { select: { fullName: true } },
      },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      fullName: u.founderProfile?.fullName || u.investorProfile?.fullName || null,
    }));
  }

  async setUserActiveStatus(adminId: string, targetUserId: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot deactivate an admin account');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive },
    });

    if (!isActive) {
      await this.activityLogService.log(adminId, ActivityEventType.USER_DEACTIVATED, targetUserId);
    }

    return { id: updated.id, email: updated.email, isActive: updated.isActive };
  }

  async getActivityLog() {
    const logs = await this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        actor: { select: { email: true, role: true } },
      },
    });

    return logs.map((l) => ({
      id: l.id,
      eventType: l.eventType,
      actorEmail: l.actor.email,
      actorRole: l.actor.role,
      targetId: l.targetId,
      metadata: l.metadata,
      createdAt: l.createdAt,
    }));
  }
}