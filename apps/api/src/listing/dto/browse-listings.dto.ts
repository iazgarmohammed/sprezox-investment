import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Sector, Stage, RoundType } from '@prisma/client';

export class BrowseListingsDto {
  @IsOptional()
  @IsEnum(Sector)
  sector?: Sector;

  @IsOptional()
  @IsEnum(Stage)
  stage?: Stage;

  @IsOptional()
  @IsEnum(RoundType)
  roundType?: RoundType;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}