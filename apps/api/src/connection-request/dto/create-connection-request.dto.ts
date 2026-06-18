import { IsUUID, IsBoolean, Equals, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateConnectionRequestDto {
  @IsUUID()
  listingId!: string;

  @IsBoolean()
  @Equals(true, { message: 'You must accept the disclaimer to request a connection' })
  disclaimerAccepted!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  introNote?: string;
}