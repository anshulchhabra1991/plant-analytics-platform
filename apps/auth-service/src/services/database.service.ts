import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { User } from '../types/auth.types';

@Injectable()
export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST || 'postgres',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      user: process.env.POSTGRES_USER || 'plantuser',
      password: process.env.POSTGRES_PASSWORD || 'plantpassword123',
      database: process.env.POSTGRES_DB || 'plant_analytics',
    });

    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      const client = await this.pool.connect();
      
      // Tables and users are now created by init scripts in infra/db/init/
      // Just verify connection is working
      await client.query('SELECT 1');

      client.release();
      console.log('✅ Auth service initialized successfully');
    } catch (error) {
      console.error('❌ Auth service initialization failed:', error);
    }
  }



  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.pool.query(
        'SELECT id, email, password, first_name, last_name, is_active, created_at, updated_at FROM users WHERE email = $1 AND is_active = true',
        [email]
      );
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        password: row.password,
        firstName: row.first_name,
        lastName: row.last_name,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async findUserById(id: string): Promise<User | null> {
    try {
      const result = await this.pool.query(
        'SELECT id, email, password, first_name, last_name, is_active, created_at, updated_at FROM users WHERE id = $1 AND is_active = true',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        password: row.password,
        firstName: row.first_name,
        lastName: row.last_name,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error('Error finding user by id:', error);
      return null;
    }
  }

  async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    try {
      const result = await this.pool.query(`
        INSERT INTO users (email, password, first_name, last_name)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, password, first_name, last_name, is_active, created_at, updated_at
      `, [
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
      ]);

      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        password: row.password,
        firstName: row.first_name,
        lastName: row.last_name,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
} 