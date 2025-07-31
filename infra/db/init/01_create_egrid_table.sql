-- Create egrid_data table for power plant data
-- Single source of truth for table creation

-- Drop table if exists (fresh start)
DROP TABLE IF EXISTS egrid_data CASCADE;

-- Create table with all constraints
CREATE TABLE egrid_data (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  net_generation NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  gen_id CHARACTER VARYING NOT NULL,
  state CHARACTER VARYING NOT NULL,
  plant_name CHARACTER VARYING NOT NULL,
  
  -- Constraints
  CONSTRAINT chk_year CHECK (year >= 1990 AND year <= 2030),
  CONSTRAINT chk_net_generation CHECK (net_generation >= 0),
  CONSTRAINT chk_state_length CHECK (length(state) >= 2),
  CONSTRAINT uk_egrid_data_unique UNIQUE (gen_id, year, state, plant_name)
);

-- Create indexes for better query performance
CREATE INDEX idx_egrid_data_state ON egrid_data(state);
CREATE INDEX idx_egrid_data_year ON egrid_data(year);
CREATE INDEX idx_egrid_data_net_generation ON egrid_data(net_generation DESC);

-- Grant permissions to the application user
GRANT SELECT, INSERT, UPDATE, DELETE ON egrid_data TO plantuser;
GRANT USAGE, SELECT ON SEQUENCE egrid_data_id_seq TO plantuser;

-- Manual DAG trigger command (sleep 5 seconds then trigger)
-- Run this after container startup:
-- sleep 5 && docker exec -it plant-analytics-airflow-webserver-1 airflow dags trigger process_csv_data_pipeline
