import { Pool, PoolClient } from 'pg';
import { User } from '../types/auth.types';

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
      
      // Create users table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          roles TEXT[] DEFAULT ARRAY['user'],
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create index on email
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
      `);

      // Insert default users if they don't exist
      await this.createDefaultUsers(client);

      client.release();
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
    }
  }

  private async createDefaultUsers(client: PoolClient): Promise<void> {
    const bcrypt = require('bcryptjs');
    const defaultPassword = await bcrypt.hash('password123', 12);

    // Check if default users exist
    const adminCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@plantanalytics.com']
    );

    if (adminCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO users (email, password, first_name, last_name, roles)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        'admin@plantanalytics.com',
        defaultPassword,
        'Admin',
        'User',
        ['admin', 'user']
      ]);
      console.log('✅ Default admin user created');
    }

    const userCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['user@plantanalytics.com']
    );

    if (userCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO users (email, password, first_name, last_name, roles)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        'user@plantanalytics.com',
        defaultPassword,
        'Regular',
        'User',
        ['user']
      ]);
      console.log('✅ Default user created');
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
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
        roles: row.roles,
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
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
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
        roles: row.roles,
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
        RETURNING *
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
        roles: row.roles,
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