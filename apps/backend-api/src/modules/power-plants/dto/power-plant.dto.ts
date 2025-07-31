import { IsOptional, IsInt, Min, Max, IsString, Length } from 'class-validator';
import { Type, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetTopPowerPlantsDto {
  @ApiPropertyOptional({
    description: 'Number of results to return',
    minimum: 1,
    maximum: 10000,
    default: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  @Type(() => Number)
  limit?: number = 12;

  @ApiPropertyOptional({
    description: 'Filter by state code (e.g., CA, TX, NY)',
    minLength: 2,
    maxLength: 2,
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  state?: string;

  @ApiPropertyOptional({
    description: 'Filter by year',
    minimum: 2000,
    maximum: 2030,
  })
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2030)
  @Type(() => Number)
  year?: number;
}

export class PowerPlantDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  genId: string;

  @ApiProperty()
  @Expose()
  year: number;

  @ApiProperty()
  @Expose()
  state: string;

  @ApiProperty()
  @Expose()
  plantName: string;

  @ApiProperty()
  @Expose()
  netGeneration: number;
}

export class MetaDto {
  @ApiProperty()
  count: number;

  @ApiProperty()
  filters: {
    limit?: number;
    state?: string;
    year?: number;
  };

  @ApiProperty()
  timestamp: string;

  @ApiPropertyOptional()
  cached?: boolean;
}

export class PowerPlantResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [PowerPlantDto] })
  data: PowerPlantDto[];

  @ApiProperty({ type: MetaDto })
  meta: MetaDto;
}

export class StatesResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [String] })
  data: string[];

  @ApiProperty({ type: MetaDto })
  meta: {
    count: number;
    timestamp: string;
    cached?: boolean;
  };
} 