import { IsString, IsOptional, MaxLength, IsUrl } from 'class-validator';

export class UpsertFounderProfileDto {
  @IsString()
  @MaxLength(100)
  fullName!: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsUrl({}, { message: 'linkedinUrl must be a valid URL' })
  @MaxLength(255)
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}