# Database Schemas

## 1. Overview

The eGRID Analytics Platform uses PostgreSQL as the primary database with the following schema design principles:
- **Normalization**: 3NF compliance for data integrity
- **Indexing**: Optimized for query performance
- **Constraints**: Foreign keys and check constraints for data validity
- **Partitioning**: Time-based partitioning for large tables

## 2. Entity Relationship Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      users      │    │   user_roles    │    │     roles       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ user_id (FK)    │    │ id (PK)         │
│ email           │────│ role_id (FK)    │────│ name            │
│ password_hash   │    └─────────────────┘    │ description     │
│ first_name      │                           │ permissions     │
│ last_name       │                           └─────────────────┘
│ created_at      │
│ updated_at      │
│ is_active       │
└─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   egrid_data    │    │  data_sources   │    │  processing_    │
├─────────────────┤    ├─────────────────┤    │     jobs        │
│ id (PK)         │    │ id (PK)         │    ├─────────────────┤
│ plant_name      │    │ name            │    │ id (PK)         │
│ state_code      │────│ type            │    │ source_id (FK)  │
│ net_generation  │    │ created_at      │────│ status          │
│ primary_fuel    │    │ updated_at      │    │ records_proc    │
│ year            │    │ is_active       │    │ started_at      │
│ source_id (FK)  │    └─────────────────┘    │ completed_at    │
│ created_at      │                           │ error_message   │
│ updated_at      │                           └─────────────────┘
└─────────────────┘

┌─────────────────┐    ┌─────────────────┐
│   audit_logs    │    │     sessions    │
├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │
│ user_id (FK)    │    │ user_id (FK)    │
│ action          │    │ token_hash      │
│ resource        │    │ ip_address      │
│ timestamp       │    │ user_agent      │
│ ip_address      │    │ created_at      │
│ user_agent      │    │ expires_at      │
│ details         │    │ is_active       │
└─────────────────┘    └─────────────────┘
```

## 3. Table Definitions

### 3.1 Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
```

### 3.2 Roles Table
```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default roles
INSERT INTO roles (name, description, permissions) VALUES
('admin', 'Administrator with full access', '["*"]'),
('user', 'Regular user with read/write access', '["read", "write"]'),
('viewer', 'Read-only access', '["read"]');
```

### 3.3 User Roles Junction Table
```sql
CREATE TABLE user_roles (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);

-- Indexes
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
```

### 3.4 eGRID Data Table
```sql
CREATE TABLE egrid_data (
    id BIGSERIAL PRIMARY KEY,
    plant_name VARCHAR(255) NOT NULL,
    state_code CHAR(2) NOT NULL,
    net_generation NUMERIC(15,2),
    primary_fuel VARCHAR(100),
    year INTEGER NOT NULL,
    source_file VARCHAR(255),
    source_id INTEGER REFERENCES data_sources(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_year CHECK (year >= 1990 AND year <= 2030),
    CONSTRAINT chk_state_code CHECK (LENGTH(state_code) = 2),
    CONSTRAINT chk_net_generation CHECK (net_generation >= 0)
) PARTITION BY RANGE (year);

-- Partitions for better performance
CREATE TABLE egrid_data_2020 PARTITION OF egrid_data 
    FOR VALUES FROM (2020) TO (2021);
CREATE TABLE egrid_data_2021 PARTITION OF egrid_data 
    FOR VALUES FROM (2021) TO (2022);
CREATE TABLE egrid_data_2022 PARTITION OF egrid_data 
    FOR VALUES FROM (2022) TO (2023);
CREATE TABLE egrid_data_2023 PARTITION OF egrid_data 
    FOR VALUES FROM (2023) TO (2024);

-- Indexes
CREATE INDEX idx_egrid_state ON egrid_data(state_code);
CREATE INDEX idx_egrid_year ON egrid_data(year);
CREATE INDEX idx_egrid_generation ON egrid_data(net_generation DESC);
CREATE INDEX idx_egrid_plant_name ON egrid_data(plant_name);
CREATE INDEX idx_egrid_source_file ON egrid_data(source_file);
```

### 3.5 Data Sources Table
```sql
CREATE TABLE data_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    file_path VARCHAR(500),
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Indexes
CREATE INDEX idx_data_sources_type ON data_sources(type);
CREATE INDEX idx_data_sources_active ON data_sources(is_active);
```

### 3.6 Processing Jobs Table
```sql
CREATE TABLE processing_jobs (
    id BIGSERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES data_sources(id),
    status VARCHAR(20) DEFAULT 'pending',
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'))
);

-- Indexes
CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX idx_processing_jobs_source ON processing_jobs(source_id);
CREATE INDEX idx_processing_jobs_created ON processing_jobs(created_at);
```

### 3.7 Sessions Table
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Indexes
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_active ON sessions(is_active);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Auto-cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run every hour)
SELECT cron.schedule('cleanup-sessions', '0 * * * *', 'SELECT cleanup_expired_sessions();');
```

### 3.8 Audit Logs Table
```sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(200),
    resource_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional metadata
    request_id UUID,
    session_id UUID
) PARTITION BY RANGE (timestamp);

-- Partitions by month for performance
CREATE TABLE audit_logs_202401 PARTITION OF audit_logs 
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE audit_logs_202402 PARTITION OF audit_logs 
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Indexes
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_resource ON audit_logs(resource, resource_id);
```

## 4. Views and Functions

### 4.1 Power Plant Analytics View
```sql
CREATE OR REPLACE VIEW v_power_plant_analytics AS
SELECT 
    plant_name,
    state_code,
    primary_fuel,
    year,
    net_generation,
    RANK() OVER (PARTITION BY year ORDER BY net_generation DESC) as generation_rank,
    AVG(net_generation) OVER (PARTITION BY state_code, year) as state_avg_generation,
    COUNT(*) OVER (PARTITION BY primary_fuel, year) as fuel_type_count
FROM egrid_data 
WHERE net_generation IS NOT NULL;
```

### 4.2 User Statistics Function
```sql
CREATE OR REPLACE FUNCTION get_user_statistics(user_id_param INTEGER)
RETURNS TABLE (
    login_count BIGINT,
    last_login TIMESTAMP,
    total_api_calls BIGINT,
    last_api_call TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE action = 'LOGIN_SUCCESS'),
        MAX(timestamp) FILTER (WHERE action = 'LOGIN_SUCCESS'),
        COUNT(*) FILTER (WHERE action LIKE 'API_%'),
        MAX(timestamp) FILTER (WHERE action LIKE 'API_%')
    FROM audit_logs 
    WHERE audit_logs.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;
```

## 5. Performance Optimization

### 5.1 Materialized Views
```sql
-- Top plants by generation (refreshed hourly)
CREATE MATERIALIZED VIEW mv_top_plants AS
SELECT 
    plant_name,
    state_code,
    primary_fuel,
    year,
    net_generation,
    RANK() OVER (ORDER BY net_generation DESC) as rank
FROM egrid_data 
WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY net_generation DESC
LIMIT 1000;

CREATE UNIQUE INDEX idx_mv_top_plants_rank ON mv_top_plants(rank);

-- Refresh schedule
SELECT cron.schedule('refresh-top-plants', '0 * * * *', 'REFRESH MATERIALIZED VIEW mv_top_plants;');
```

### 5.2 Database Statistics
```sql
-- Table sizes and statistics
CREATE OR REPLACE VIEW v_table_statistics AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;
```

## 6. Security and Permissions

### 6.1 Row Level Security
```sql
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY user_self_access ON users
    FOR ALL
    TO app_user
    USING (id = current_setting('app.user_id')::INTEGER);

-- Admins can see all audit logs, users only their own
CREATE POLICY audit_access ON audit_logs
    FOR SELECT
    TO app_user
    USING (
        user_id = current_setting('app.user_id')::INTEGER OR
        current_setting('app.user_role') = 'admin'
    );
```

### 6.2 Database Roles
```sql
-- Application database user
CREATE ROLE app_user WITH LOGIN PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE egrid_analytics TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Read-only user for reporting
CREATE ROLE read_only_user WITH LOGIN PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE egrid_analytics TO read_only_user;
GRANT USAGE ON SCHEMA public TO read_only_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO read_only_user;
``` 