import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ListingStatus, RequestStatus, ActivityEventType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CreateConnectionRequestDto } from './dto/create-connection-request.dto';
import { ReviewConnectionRequestDto, ConnectionReviewDecision } from './dto/review-connection-request.dto';

@Injectable()
export class ConnectionRequestService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private activityLogService: ActivityLogService,
  ) {}

  async createRequest(investorId: string, dto: CreateConnectionRequestDto) {
    const listing = await this.prisma.fundraisingListing.findUnique({ where: { id: dto.listingId } });

    if (!listing || listing.status !== ListingStatus.Live) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.investorCount >= listing.investorCap) {
      throw new ConflictException(
        'This listing has reached its investor cap and is no longer accepting connection requests',
      );
    }

    const existing = await this.prisma.connectionRequest.findUnique({
      where: { listingId_investorId: { listingId: dto.listingId, investorId } },
    });

    if (existing) {
      throw new ConflictException('You have already requested a connection for this listing');
    }

    const request = await this.prisma.connectionRequest.create({
      data: {
        listingId: dto.listingId,
        investorId,
        disclaimerAccepted: dto.disclaimerAccepted,
        introNote: dto.introNote,
      },
    });

    await this.activityLogService.log(
      investorId,
      ActivityEventType.CONNECTION_REQUESTED,
      dto.listingId,
    );

    return request;
  }

  async getMyRequestForListing(investorId: string, listingId: string) {
    return this.prisma.connectionRequest.findUnique({
      where: { listingId_investorId: { listingId, investorId } },
    });
  }

  async getMyRequests(investorId: string) {
    return this.prisma.connectionRequest.findMany({
      where: { investorId },
      orderBy: { requestedAt: 'desc' },
      include: {
        listing: {
          select: {
            id: true,
            roundType: true,
            startup: { select: { name: true, logoUrl: true } },
          },
        },
      },
    });
  }

  async getRequestsForFounder(founderId: string) {
    const startup = await this.prisma.startup.findFirst({ where: { founderId } });

    if (!startup) {
      return [];
    }

    const requests = await this.prisma.connectionRequest.findMany({
      where: { listing: { startupId: startup.id } },
      orderBy: { requestedAt: 'desc' },
      include: {
        investor: {
          select: {
            email: true,
            investorProfile: { select: { fullName: true, bio: true, investmentThesis: true, linkedinUrl: true } },
          },
        },
      },
    });

    return requests.map((r) => ({
      id: r.id,
      status: r.status,
      introNote: r.introNote,
      requestedAt: r.requestedAt,
      resolvedAt: r.resolvedAt,
      investor: {
        email: r.investor.email,
        fullName: r.investor.investorProfile?.fullName || null,
        bio: r.investor.investorProfile?.bio || null,
        investmentThesis: r.investor.investorProfile?.investmentThesis || null,
        linkedinUrl: r.investor.investorProfile?.linkedinUrl || null,
      },
    }));
  }

  async reviewRequest(founderId: string, requestId: string, dto: ReviewConnectionRequestDto) {
    const request = await this.prisma.connectionRequest.findUnique({
      where: { id: requestId },
      include: {
        listing: { include: { startup: true } },
        investor: { include: { investorProfile: true } },
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.listing.startup.founderId !== founderId) {
      throw new ForbiddenException('You do not have permission to review this request');
    }

    if (request.status !== RequestStatus.Pending) {
      throw new ConflictException('This request has already been reviewed');
    }

    if (dto.decision === ConnectionReviewDecision.DECLINE) {
      const updated = await this.prisma.connectionRequest.update({
        where: { id: requestId },
        data: { status: RequestStatus.Declined, resolvedAt: new Date() },
      });

      await this.activityLogService.log(founderId, ActivityEventType.CONNECTION_DECLINED, requestId);

      return updated;
    }

    // APPROVE path: re-check cap atomically and increment investorCount
    const listing = await this.prisma.fundraisingListing.findUnique({
      where: { id: request.listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.investorCount >= listing.investorCap) {
      throw new ConflictException('This listing has reached its investor cap');
    }

    const founder = await this.prisma.user.findUnique({
      where: { id: founderId },
      include: { founderProfile: true },
    });

    const [updated] = await this.prisma.$transaction([
      this.prisma.connectionRequest.update({
        where: { id: requestId },
        data: { status: RequestStatus.Approved, resolvedAt: new Date() },
      }),
      this.prisma.fundraisingListing.update({
        where: { id: request.listingId },
        data: { investorCount: { increment: 1 } },
      }),
    ]);

    await this.activityLogService.log(founderId, ActivityEventType.CONNECTION_APPROVED, requestId);

    await this.mailService.sendConnectionApprovedEmail(
      founder!.email,
      founder!.founderProfile?.fullName || founder!.email,
      request.investor.email,
      request.investor.investorProfile?.fullName || request.investor.email,
      request.listing.startup.name,
    );

    return updated;
  }
}