-- Create table with all constraints
CREATE TABLE egrid_data (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  net_generation NUMERIC(20,2) NOT NULL,
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

-- Table creation complete
