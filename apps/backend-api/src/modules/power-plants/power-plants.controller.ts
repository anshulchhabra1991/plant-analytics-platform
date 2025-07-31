import {
  Controller,
  Get,
  Query,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import { PowerPlantsService } from './power-plants.service';
import { GetTopPowerPlantsDto, PowerPlantResponseDto, StatesResponseDto, PowerPlantDto } from './dto/power-plant.dto';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { ConfigService } from '../../config/config.service';

@ApiTags('power-plants')
@Controller('power-plants')
export class PowerPlantsController {
  private readonly logger = new Logger(PowerPlantsController.name);

  constructor(
    private readonly powerPlantsService: PowerPlantsService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  @Get('top')
  @ApiOperation({ summary: 'Get top power plants by net generation' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results to return (max 10000)' })
  @ApiQuery({ name: 'state', required: false, type: String, description: 'Filter by state code' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Filter by year' })
  @ApiResponse({ status: 200, description: 'Top power plants retrieved successfully', type: PowerPlantResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid parameters' })
  async getTopPowerPlants(@Query() dto: GetTopPowerPlantsDto): Promise<PowerPlantResponseDto> {
    this.logger.log(`API Call - GET /power-plants/top with params: ${JSON.stringify(dto)}`);
    
    try {
      const cacheKey = this.redisService.generateCacheKey('top_power_plants', dto);
      
      const cachedResult = await this.redisService.get(cacheKey);
      if (cachedResult) {
        this.logger.log(`Cache hit for key: ${cacheKey}`);
        const parsedResult = JSON.parse(cachedResult);
        parsedResult.meta.cached = true;
        return parsedResult;
      }

      const powerPlants = await this.powerPlantsService.getTopPowerPlants(dto);
      
      const powerPlantDtos = powerPlants.map(plant => plainToClass(PowerPlantDto, plant, { excludeExtraneousValues: true }));
      
      const response: PowerPlantResponseDto = {
        success: true,
        data: powerPlantDtos,
        meta: {
          count: powerPlantDtos.length,
          filters: {
            limit: dto.limit,
            state: dto.state,
            year: dto.year,
          },
          timestamp: new Date().toISOString(),
          cached: false,
        }
      };

      if (powerPlantDtos.length > 0) {
        await this.redisService.set(cacheKey, JSON.stringify(response), 300);
      }
      
      this.logger.log(`API Response - GET /power-plants/top: ${powerPlantDtos.length} power plants returned`);
      return response;

    } catch (error) {
      this.logger.error(`Error in getTopPowerPlants: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to retrieve top power plants',
            details: this.configService.isDevelopment ? error.message : undefined,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('states')
  @ApiOperation({ summary: 'Get all available states' })
  @ApiResponse({ status: 200, description: 'States retrieved successfully', type: StatesResponseDto })
  async getStates(): Promise<StatesResponseDto> {
    this.logger.log('API Call - GET /power-plants/states');
    
    try {
      const cacheKey = 'available_states';
      
      const cachedResult = await this.redisService.get(cacheKey);
      if (cachedResult) {
        this.logger.log(`Cache hit for key: ${cacheKey}`);
        const parsedResult = JSON.parse(cachedResult);
        parsedResult.meta.cached = true;
        return parsedResult;
      }

      const states = await this.powerPlantsService.getStates();
      
      const response: StatesResponseDto = {
        success: true,
        data: states,
        meta: {
          count: states.length,
          timestamp: new Date().toISOString(),
          cached: false,
        }
      };

      if (states.length > 0) {
        await this.redisService.set(cacheKey, JSON.stringify(response), 600);
      }
      
      this.logger.log(`API Response - GET /power-plants/states: ${states.length} states returned`);
      return response;

    } catch (error) {
      this.logger.error(`Error in getStates: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to retrieve states',
            details: this.configService.isDevelopment ? error.message : undefined,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 