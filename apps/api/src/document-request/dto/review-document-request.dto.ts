import { IsEnum } from 'class-validator';

export enum DocumentReviewDecision {
  APPROVE = 'APPROVE',
  DECLINE = 'DECLINE',
}

export class ReviewDocumentRequestDto {
  @IsEnum(DocumentReviewDecision)
  decision!: DocumentReviewDecision;
}