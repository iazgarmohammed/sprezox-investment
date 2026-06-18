import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

export enum ReviewDecision {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ReviewListingDto {
  @IsEnum(ReviewDecision)
  decision!: ReviewDecision;

  @ValidateIf((o) => o.decision === ReviewDecision.REJECT)
  @IsString({ message: 'adminNote is required when rejecting a listing' })
  adminNote?: string;
}