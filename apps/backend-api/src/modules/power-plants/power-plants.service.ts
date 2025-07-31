import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PowerPlant } from '../../domain/entities/power-plant.entity';
import { GetTopPowerPlantsDto } from './dto/power-plant.dto';

@Injectable()
export class PowerPlantsService {
  private readonly logger = new Logger(PowerPlantsService.name);

  constructor(
    @InjectRepository(PowerPlant)
    private powerPlantRepository: Repository<PowerPlant>,
  ) {}

  async getTopPowerPlants(dto: GetTopPowerPlantsDto): Promise<PowerPlant[]> {
    this.logger.log(`Getting top ${dto.limit} power plants with filters: ${JSON.stringify(dto)}`);
    
    const query = this.powerPlantRepository
      .createQueryBuilder('egrid_data')
      .select([
        'egrid_data.id',
        'egrid_data.genId',
        'egrid_data.year',
        'egrid_data.state',
        'egrid_data.plantName',
        'egrid_data.netGeneration'
      ]);

    if (dto.state) {
      query.andWhere('egrid_data.state = :state', { state: dto.state.toUpperCase() });
    }

    if (dto.year) {
      query.andWhere('egrid_data.year = :year', { year: dto.year });
    }

    const powerPlants = await query
      .orderBy('egrid_data.netGeneration', 'DESC')
      .limit(dto.limit || 12)
      .getMany();

    this.logger.log(`Retrieved ${powerPlants.length} top power plants`);
    return powerPlants;
  }

  async getStates(): Promise<string[]> {
    this.logger.log('Retrieving available states');
    
    const result = await this.powerPlantRepository
      .createQueryBuilder('egrid_data')
      .select('DISTINCT egrid_data.state', 'state')
      .orderBy('egrid_data.state', 'ASC')
      .getRawMany();

    const states = result.map(row => row.state).filter(Boolean);
    this.logger.log(`Retrieved ${states.length} states`);
    return states;
  }

  async getYears(): Promise<number[]> {
    this.logger.log('Retrieving available years');
    
    const result = await this.powerPlantRepository
      .createQueryBuilder('egrid_data')
      .select('DISTINCT egrid_data.year', 'year')
      .orderBy('egrid_data.year', 'DESC')
      .getRawMany();

    const years = result.map(row => parseInt(row.year)).filter(Boolean);
    this.logger.log(`Retrieved ${years.length} years`);
    return years;
  }
} 