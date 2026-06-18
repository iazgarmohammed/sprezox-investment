import {
  IsString,
  IsOptional,
  MaxLength,
  IsUrl,
  IsArray,
  IsEnum,
  IsInt,
  Min,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Sector, Stage } from '@prisma/client';

export class UpsertInvestorProfileDto {
  @IsString()
  @MaxLength(100)
  fullName!: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  investmentThesis?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minChequeSizeInr?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxChequeSizeInr?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @IsEnum(Sector, { each: true })
  sectors?: Sector[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsEnum(Stage, { each: true })
  stages?: Stage[];

  @IsOptional()
  @IsUrl({}, { message: 'linkedinUrl must be a valid URL' })
  @MaxLength(255)
  linkedinUrl?: string;
}