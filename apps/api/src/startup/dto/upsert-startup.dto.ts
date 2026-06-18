import { IsString, IsOptional, IsEnum, MaxLength, IsUrl, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Sector, Stage } from '@prisma/client';

export class UpsertStartupDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsEnum(Sector)
  sector!: Sector;

  @IsEnum(Stage)
  stage!: Stage;

  @IsString()
  @MaxLength(160)
  oneLiner!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl({}, { message: 'websiteUrl must be a valid URL' })
  @MaxLength(255)
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teamSize?: number;
}