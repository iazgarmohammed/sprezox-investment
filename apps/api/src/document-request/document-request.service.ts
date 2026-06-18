import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ListingStatus, RequestStatus, ActivityEventType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ReviewDocumentRequestDto, DocumentReviewDecision } from './dto/review-document-request.dto';

@Injectable()
export class DocumentRequestService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private activityLogService: ActivityLogService,
  ) {}

  async createRequest(investorId: string, listingId: string) {
    const listing = await this.prisma.fundraisingListing.findUnique({ where: { id: listingId } });

    if (!listing || listing.status !== ListingStatus.Live) {
      throw new NotFoundException('Listing not found');
    }

    const existing = await this.prisma.documentRequest.findUnique({
      where: { listingId_investorId: { listingId, investorId } },
    });

    if (existing) {
      throw new ConflictException('You have already requested access to this pitch deck');
    }

    const request = await this.prisma.documentRequest.create({
      data: { listingId, investorId },
    });

    await this.activityLogService.log(
      investorId,
      ActivityEventType.DOCUMENT_REQUESTED,
      listingId,
    );

    return request;
  }

  async getMyRequestForListing(investorId: string, listingId: string) {
    return this.prisma.documentRequest.findUnique({
      where: { listingId_investorId: { listingId, investorId } },
    });
  }

  async getMyRequests(investorId: string) {
    const requests = await this.prisma.documentRequest.findMany({
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

    return requests;
  }

  async getRequestsForFounder(founderId: string) {
    const startup = await this.prisma.startup.findFirst({ where: { founderId } });

    if (!startup) {
      return [];
    }

    const requests = await this.prisma.documentRequest.findMany({
      where: { listing: { startupId: startup.id } },
      orderBy: { requestedAt: 'desc' },
      include: {
        investor: {
          select: {
            email: true,
            investorProfile: { select: { fullName: true, bio: true, linkedinUrl: true } },
          },
        },
      },
    });

    return requests.map((r) => ({
      id: r.id,
      status: r.status,
      requestedAt: r.requestedAt,
      resolvedAt: r.resolvedAt,
      investor: {
        email: r.investor.email,
        fullName: r.investor.investorProfile?.fullName || null,
        bio: r.investor.investorProfile?.bio || null,
        linkedinUrl: r.investor.investorProfile?.linkedinUrl || null,
      },
    }));
  }

  async reviewRequest(founderId: string, requestId: string, dto: ReviewDocumentRequestDto) {
    const request = await this.prisma.documentRequest.findUnique({
      where: { id: requestId },
      include: { listing: { include: { startup: true } } },
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

    const newStatus =
      dto.decision === DocumentReviewDecision.APPROVE ? RequestStatus.Approved : RequestStatus.Declined;

    const updated = await this.prisma.documentRequest.update({
      where: { id: requestId },
      data: { status: newStatus, resolvedAt: new Date() },
    });

    await this.activityLogService.log(
      founderId,
      newStatus === RequestStatus.Approved
        ? ActivityEventType.DOCUMENT_APPROVED
        : ActivityEventType.DOCUMENT_DECLINED,
      requestId,
    );

    return updated;
  }

  async getDeckUrlForRequest(investorId: string, requestId: string) {
    const request = await this.prisma.documentRequest.findUnique({
      where: { id: requestId },
      include: { listing: true },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.investorId !== investorId) {
      throw new ForbiddenException('You do not have permission to view this document');
    }

    if (request.status !== RequestStatus.Approved) {
      throw new ForbiddenException('Your request for this pitch deck has not been approved');
    }

    if (!request.listing.pitchDeckUrl) {
      throw new NotFoundException('No pitch deck is available for this listing');
    }

    const signedUrl = await this.storageService.getSignedUrl(request.listing.pitchDeckUrl, 180);
    return { signedUrl };
  }
}