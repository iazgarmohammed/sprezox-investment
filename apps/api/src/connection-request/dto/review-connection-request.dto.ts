import { IsEnum } from 'class-validator';

export enum ConnectionReviewDecision {
  APPROVE = 'APPROVE',
  DECLINE = 'DECLINE',
}

export class ReviewConnectionRequestDto {
  @IsEnum(ConnectionReviewDecision)
  decision!: ConnectionReviewDecision;
}