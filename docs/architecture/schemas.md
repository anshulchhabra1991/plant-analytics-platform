# Database Schema Documentation

## 1. Overview

The Plant Analytics Platform uses PostgreSQL as the primary database with optimized schemas for performance and scalability.

## 2. Database Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Database Schema                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│      users                    egrid_data                   │
│ ┌─────────────────┐      ┌─────────────────────────────────┐│
│ │ id (UUID, PK)   │      │ id (Serial, PK)                ││
│ │ email           │      │ plant_name                     ││
│ │ password        │      │ plant_state                    ││
│ │ first_name      │      │ generation_mwh                 ││
│ │ last_name       │      │ year                           ││
│ │ is_active       │      │ utility_name                   ││
│ │ created_at      │      │ primary_fuel                   ││
│ │ updated_at      │      │ ...                            ││
│ └─────────────────┘      └─────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 3. Schema Details

### 3.1 Users Table

Simple authentication table for JWT-based auth:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_password_length CHECK (LENGTH(password) >= 8),
    CONSTRAINT chk_first_name_length CHECK (LENGTH(first_name) >= 1),
    CONSTRAINT chk_last_name_length CHECK (LENGTH(last_name) >= 1)
);

-- Indexes for fast access
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_email_active ON users(email, is_active);
```

### 3.2 Power Plant Data Table

Main data table for power plant information:

```sql
CREATE TABLE egrid_data (
    id SERIAL PRIMARY KEY,
    plant_name VARCHAR(255) NOT NULL,
    plant_state VARCHAR(2) NOT NULL,
    utility_name VARCHAR(255),
    primary_fuel VARCHAR(100),
    other_fuel1 VARCHAR(100),
    other_fuel2 VARCHAR(100),
    other_fuel3 VARCHAR(100),
    generation_mwh NUMERIC(20,2) DEFAULT 0,
    co2_emissions_tons NUMERIC(20,2) DEFAULT 0,
    so2_emissions_lbs NUMERIC(20,2) DEFAULT 0,
    nox_emissions_lbs NUMERIC(20,2) DEFAULT 0,
    year INTEGER NOT NULL,
    data_source VARCHAR(50) DEFAULT 'EPA_EGRID',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX idx_egrid_generation ON egrid_data(generation_mwh DESC);
CREATE INDEX idx_egrid_state ON egrid_data(plant_state);
CREATE INDEX idx_egrid_year ON egrid_data(year);
CREATE INDEX idx_egrid_composite ON egrid_data(plant_state, year, generation_mwh DESC);
```

## 4. Data Types and Constraints

### 4.1 High-Precision Numerics

Uses `NUMERIC(20,2)` for all generation and emission values to handle:
- Large-scale power generation (billions of MWh)
- Precise decimal calculations
- Financial-grade accuracy

### 4.2 UUID Primary Keys

User table uses UUIDs for:
- Better security (non-sequential)
- Distributed system compatibility
- Better privacy protection

## 5. Performance Optimizations

### 5.1 Strategic Indexing

```sql
-- Composite index for most common query pattern
CREATE INDEX idx_egrid_composite ON egrid_data(plant_state, year, generation_mwh DESC);

-- Authentication lookup optimization
CREATE INDEX idx_users_email_active ON users(email, is_active);
```

### 5.2 Query Patterns

Optimized for:
- Top N power plants by generation
- State-wise filtering
- Year-based historical analysis
- User authentication lookup

## 6. Security Features

### 6.1 Database Access

Database access is handled directly through the configured database user without role-based permissions.

### 6.2 Row Level Security

```sql
-- Example for future implementation
ALTER TABLE egrid_data ENABLE ROW LEVEL SECURITY;
```

## 7. Maintenance

### 7.1 Automated Tasks

```sql
-- No session management - using JWT tokens with built-in expiry
-- Maintenance tasks can be added here if needed in the future
```

### 7.2 Backup Strategy

- **Daily**: Full database backup
- **Hourly**: Incremental backups
- **Real-time**: WAL-E for point-in-time recovery

## 8. Migration Strategy

### 8.1 Schema Versioning

All schema changes are version-controlled in `infra/db/init/` directory:
- `01_create_egrid_table.sql` - Power plant data
- `02_create_auth_tables.sql` - Authentication (users only)
- `04_create_audit_tables.sql` - Audit logging

### 8.2 Production Deployment

1. Test migrations in staging
2. Apply during maintenance window
3. Verify data integrity
4. Update application configuration 