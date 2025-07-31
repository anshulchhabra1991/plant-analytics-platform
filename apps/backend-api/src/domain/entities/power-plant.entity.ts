import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('egrid_data')
export class PowerPlant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'gen_id' })
  genId: string;

  @Column()
  year: number;

  @Column()
  state: string;

  @Column({ name: 'plant_name' })
  plantName: string;

  @Column({ name: 'net_generation', type: 'decimal', precision: 15, scale: 2 })
  netGeneration: number;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
} 