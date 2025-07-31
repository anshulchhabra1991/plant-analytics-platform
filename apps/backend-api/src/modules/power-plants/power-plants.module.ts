import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PowerPlantsController } from './power-plants.controller';
import { PowerPlantsService } from './power-plants.service';
import { PowerPlant } from '../../domain/entities/power-plant.entity';
import { CacheModule } from '../../infrastructure/cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PowerPlant]),
    CacheModule,
  ],
  controllers: [PowerPlantsController],
  providers: [PowerPlantsService],
  exports: [PowerPlantsService],
})
export class PowerPlantsModule {} 