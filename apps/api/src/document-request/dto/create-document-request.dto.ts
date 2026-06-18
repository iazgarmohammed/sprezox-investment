import { IsUUID } from 'class-validator';

export class CreateDocumentRequestDto {
  @IsUUID()
  listingId!: string;
}