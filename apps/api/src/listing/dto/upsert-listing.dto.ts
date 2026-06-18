import { IsEnum, IsOptional, IsString, IsInt, Min, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { RoundType, Instrument } from '@prisma/client';

export class UpsertListingDto {
  @IsEnum(RoundType)
  roundType!: RoundType;

  @Type(() => Number)
  @IsInt()
  @Min(100000, { message: 'targetAmountInr must be at least ₹1,00,000' })
  targetAmountInr!: number;

  @IsEnum(Instrument)
  instrument!: Instrument;

  @IsOptional()
  @IsString()
  useOfFunds?: string;

  @IsOptional()
  @IsArray()
  tractionHighlights?: string[];
}