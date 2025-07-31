#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const csv = require('csv-parser');

// Database configuration
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'egrid',
  user: process.env.POSTGRES_USER || 'egriduser',
  password: process.env.POSTGRES_PASSWORD || 'egridpass',
});

async function seedData() {
  const csvFilePath = path.join(__dirname, '../data/egridData.csv');
  
  if (!fs.existsSync(csvFilePath)) {
    console.error('❌ CSV file not found:', csvFilePath);
    process.exit(1);
  }

  console.log('🌱 Starting data seeding...');
  console.log('📁 Reading from:', csvFilePath);

  try {
    // Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS egrid_data (
        id SERIAL PRIMARY KEY,
        generator_id VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL,
        state VARCHAR(255) NOT NULL,
        plant_name VARCHAR(255) NOT NULL,
        net_generation DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(state, year, plant_name, generator_id, net_generation)
      );
    `);

    // Table and indexes created by init script

    // Clear existing data
    const deleteResult = await pool.query('DELETE FROM egrid_data');
    console.log(`🗑️  Cleared ${deleteResult.rowCount} existing records`);

    let recordCount = 0;
    let batchSize = 1000;
    let batch = [];

    const processRow = (row) => {
      // Skip header rows
      if (row['Data Year'] === 'YEAR' || !row['Data Year']) {
        return;
      }

      // Parse and clean the data
      const year = parseInt(row['Data Year']);
      const state = row['Plant state abbreviation']?.trim();
      const plantName = row['Plant name']?.trim();
      const generatorId = row['Generator ID']?.trim();
      let netGeneration = row['Generator annual net generation (MWh)'];
      
      // Remove quotes and commas from number
      if (typeof netGeneration === 'string') {
        netGeneration = parseFloat(netGeneration.replace(/[",]/g, ''));
      } else {
        netGeneration = parseFloat(netGeneration);
      }

      // Validate required fields
      if (!year || !state || !plantName || !generatorId || isNaN(netGeneration)) {
        console.warn('⚠️  Skipping invalid row:', { year, state, plantName, generatorId, netGeneration });
        return;
      }

      batch.push({
        year,
        state,
        plantName,
        generatorId,
        netGeneration
      });

      recordCount++;

      if (batch.length >= batchSize) {
        return insertBatch(batch.splice(0, batchSize));
      }
    };

    const insertBatch = async (batchData) => {
      if (batchData.length === 0) return;

      const values = batchData.map((_, index) => {
        const base = index * 5;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
      }).join(', ');

      const params = batchData.flatMap(row => [
        row.generatorId,
        row.year,
        row.state,
        row.plantName,
        row.netGeneration
      ]);

      const query = `
        INSERT INTO egrid_data (generator_id, year, state, plant_name, net_generation)
        VALUES ${values}
        ON CONFLICT (state, year, plant_name, generator_id, net_generation)
        DO NOTHING
      `;

      try {
        const result = await pool.query(query, params);
        console.log(`✅ Inserted batch of ${batchData.length} records`);
        return result;
      } catch (error) {
        console.error('❌ Error inserting batch:', error.message);
        throw error;
      }
    };

    // Process CSV file
    const csvStream = fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', processRow)
      .on('end', async () => {
        try {
          // Insert remaining batch
          if (batch.length > 0) {
            await insertBatch(batch);
          }

          // Get final statistics
          const countResult = await pool.query('SELECT COUNT(*) as total FROM egrid_data');
          const statesResult = await pool.query('SELECT COUNT(DISTINCT state) as states FROM egrid_data');
          const yearsResult = await pool.query('SELECT COUNT(DISTINCT year) as years FROM egrid_data');

          console.log('\n🎉 Data seeding completed successfully!');
          console.log(`📊 Statistics:`);
          console.log(`   - Total records: ${countResult.rows[0].total}`);
          console.log(`   - States: ${statesResult.rows[0].states}`);
          console.log(`   - Years: ${yearsResult.rows[0].years}`);
          console.log(`   - Processed: ${recordCount} records from CSV`);

          await pool.end();
        } catch (error) {
          console.error('❌ Error in final processing:', error);
          process.exit(1);
        }
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV file:', error);
        process.exit(1);
      });

  } catch (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }
}

// Handle CLI execution
if (require.main === module) {
  seedData().catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = { seedData }; 