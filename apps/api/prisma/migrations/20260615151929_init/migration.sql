-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FOUNDER', 'INVESTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "Sector" AS ENUM ('Fintech', 'Healthtech', 'SaaS', 'EdTech', 'ConsumerTech', 'DeepTech', 'Other');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('PreSeed', 'Seed', 'SeriesA');

-- CreateEnum
CREATE TYPE "RoundType" AS ENUM ('PreSeed', 'Seed', 'Bridge', 'SeriesA');

-- CreateEnum
CREATE TYPE "Instrument" AS ENUM ('Equity', 'SAFE', 'ConvertibleNote');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('Draft', 'Pending', 'Live', 'Rejected', 'Closed');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('Pending', 'Approved', 'Declined');

-- CreateEnum
CREATE TYPE "ActivityEventType" AS ENUM ('LISTING_SUBMITTED', 'LISTING_APPROVED', 'LISTING_REJECTED', 'DOCUMENT_REQUESTED', 'DOCUMENT_APPROVED', 'DOCUMENT_DECLINED', 'CONNECTION_REQUESTED', 'CONNECTION_APPROVED', 'CONNECTION_DECLINED', 'USER_DEACTIVATED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hasAcceptedTerms" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "founder_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" VARCHAR(100) NOT NULL,
    "bio" TEXT,
    "linkedinUrl" VARCHAR(255),
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "founder_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "startups" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" TEXT NOT NULL,
    "sector" "Sector" NOT NULL,
    "stage" "Stage" NOT NULL,
    "oneLiner" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "websiteUrl" VARCHAR(255),
    "location" VARCHAR(100),
    "teamSize" INTEGER,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "startups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fundraising_listings" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "roundType" "RoundType" NOT NULL,
    "targetAmountInr" BIGINT NOT NULL,
    "instrument" "Instrument" NOT NULL,
    "useOfFunds" TEXT,
    "tractionHighlights" JSONB,
    "status" "ListingStatus" NOT NULL DEFAULT 'Draft',
    "pitchDeckUrl" TEXT,
    "investorCount" INTEGER NOT NULL DEFAULT 0,
    "investorCap" INTEGER NOT NULL DEFAULT 200,
    "adminNote" TEXT,
    "submittedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fundraising_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" VARCHAR(100) NOT NULL,
    "bio" TEXT,
    "investmentThesis" TEXT,
    "minChequeSizeInr" BIGINT,
    "maxChequeSizeInr" BIGINT,
    "sectors" TEXT[],
    "stages" TEXT[],
    "linkedinUrl" VARCHAR(255),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_requests" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'Pending',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "document_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connection_requests" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'Pending',
    "disclaimerAccepted" BOOLEAN NOT NULL,
    "introNote" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "connection_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetId" TEXT,
    "eventType" "ActivityEventType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "founder_profiles_userId_key" ON "founder_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "startups_slug_key" ON "startups"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "investor_profiles_userId_key" ON "investor_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "document_requests_listingId_investorId_key" ON "document_requests"("listingId", "investorId");

-- CreateIndex
CREATE UNIQUE INDEX "connection_requests_listingId_investorId_key" ON "connection_requests"("listingId", "investorId");

-- AddForeignKey
ALTER TABLE "founder_profiles" ADD CONSTRAINT "founder_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startups" ADD CONSTRAINT "startups_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fundraising_listings" ADD CONSTRAINT "fundraising_listings_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_profiles" ADD CONSTRAINT "investor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "fundraising_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "fundraising_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
