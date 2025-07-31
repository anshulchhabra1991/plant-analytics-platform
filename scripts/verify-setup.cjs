#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 eGRID Analytics Platform - Setup Verification');
console.log('='.repeat(50));

let errors = 0;
let warnings = 0;

function checkPassed(message) {
  console.log(`✅ ${message}`);
}

function checkWarning(message) {
  console.log(`⚠️  ${message}`);
  warnings++;
}

function checkFailed(message) {
  console.log(`❌ ${message}`);
  errors++;
}

// Check Node.js version
function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 18) {
    checkPassed(`Node.js version: ${nodeVersion}`);
  } else {
    checkFailed(`Node.js version ${nodeVersion} is too old. Required: >= 18.0.0`);
  }
}

// Check Docker and Docker Compose
function checkDocker() {
  try {
    const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
    checkPassed(`Docker: ${dockerVersion}`);
  } catch (error) {
    checkFailed('Docker is not installed or not accessible');
  }

  try {
    const composeVersion = execSync('docker compose version', { encoding: 'utf8' }).trim();
    checkPassed(`Docker Compose: ${composeVersion}`);
  } catch (error) {
    checkFailed('Docker Compose is not installed or not accessible');
  }
}

// Check required files
function checkRequiredFiles() {
  const requiredFiles = [
    'package.json',
    'infrastructure/docker/docker-compose.yml',
    'services/backend/package.json',
    'services/frontend/package.json',
    'services/api-gateway/package.json',
    'data/egridData.csv',
    'infrastructure/airflow-pipeline/requirements.txt',
  ];

  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      checkPassed(`Required file: ${file}`);
    } else {
      checkFailed(`Missing required file: ${file}`);
    }
  });
}

// Check environment configuration
function checkEnvironmentConfig() {
  const envExample = 'config/.env.example';
  const envFile = '.env';

  if (fs.existsSync(envExample)) {
    checkPassed('Environment example file exists');
  } else {
    checkWarning('Environment example file (.env.example) not found');
  }

  if (fs.existsSync(envFile)) {
    checkPassed('Environment file (.env) exists');
  } else {
    checkWarning('Environment file (.env) not found - using defaults');
  }
}

// Check dependencies
function checkDependencies() {
  try {
    // Check root dependencies
    const rootPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (rootPackage.dependencies || rootPackage.devDependencies) {
      checkPassed('Root package.json has dependencies defined');
    }

    // Check if node_modules exists
    if (fs.existsSync('node_modules')) {
      checkPassed('Node modules installed at root level');
    } else {
      checkWarning('Root node_modules not found - run npm install');
    }

    // Check service dependencies
    const services = ['backend', 'frontend', 'api-gateway'];
    services.forEach(service => {
      const servicePath = `services/${service}`;
      const packagePath = `${servicePath}/package.json`;
      const nodeModulesPath = `${servicePath}/node_modules`;

      if (fs.existsSync(packagePath)) {
        checkPassed(`${service} package.json exists`);
      } else {
        checkFailed(`${service} package.json missing`);
      }

      if (fs.existsSync(nodeModulesPath)) {
        checkPassed(`${service} dependencies installed`);
      } else {
        checkWarning(`${service} node_modules not found - run npm install in ${servicePath}`);
      }
    });

  } catch (error) {
    checkFailed('Error checking dependencies: ' + error.message);
  }
}

// Check Docker services
function checkDockerServices() {
  try {
    execSync('docker compose -f infrastructure/docker/docker-compose.yml config', { 
      stdio: 'pipe',
      timeout: 10000 
    });
    checkPassed('Docker Compose configuration is valid');
  } catch (error) {
    checkFailed('Docker Compose configuration is invalid');
  }
}

// Check Python and pip (for Airflow)
function checkPython() {
  try {
    const pythonVersion = execSync('python3 --version', { encoding: 'utf8' }).trim();
    checkPassed(`Python: ${pythonVersion}`);
  } catch (error) {
    checkWarning('Python 3 not found - required for Airflow development');
  }

  try {
    const pipVersion = execSync('pip3 --version', { encoding: 'utf8' }).trim();
    checkPassed(`Pip: ${pipVersion}`);
  } catch (error) {
    checkWarning('Pip 3 not found - required for Airflow development');
  }
}

// Check Git configuration
function checkGit() {
  try {
    const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
    checkPassed(`Git: ${gitVersion}`);

    // Check if this is a git repository
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    checkPassed('Git repository initialized');

    // Check for Husky
    if (fs.existsSync('.husky')) {
      checkPassed('Husky hooks directory exists');
    } else {
      checkWarning('Husky hooks not found - run npm run prepare');
    }

  } catch (error) {
    checkWarning('Git repository not initialized or Git not available');
  }
}

// Check ports availability
function checkPorts() {
  const requiredPorts = [3000, 4000, 5432, 6379, 5672, 8080, 8000, 9000, 9001, 15672];
  
  console.log('\n🔌 Checking port availability...');
  
  // Note: This is a basic check - in production you'd want more robust port checking
  requiredPorts.forEach(port => {
    try {
      // Simple check - try to get info about what might be using the port
      const result = execSync(`lsof -i :${port} 2>/dev/null || echo "Available"`, { 
        encoding: 'utf8',
        timeout: 1000 
      });
      
      if (result.trim() === 'Available') {
        checkPassed(`Port ${port} is available`);
      } else {
        checkWarning(`Port ${port} may be in use`);
      }
    } catch (error) {
      // If lsof command fails, assume port checking isn't available
      checkPassed(`Port ${port} status unknown (lsof not available)`);
    }
  });
}

// Check system resources
function checkSystemResources() {
  console.log('\n💻 System Resources:');
  
  try {
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();
    const memGB = (totalMem / 1024 / 1024 / 1024).toFixed(2);
    const freeGB = (freeMem / 1024 / 1024 / 1024).toFixed(2);
    
    console.log(`   💾 Total Memory: ${memGB} GB`);
    console.log(`   🆓 Free Memory: ${freeGB} GB`);
    
    if (freeMem > 2 * 1024 * 1024 * 1024) { // 2GB
      checkPassed('Sufficient memory available');
    } else {
      checkWarning('Low memory - may affect Docker performance');
    }

    const cpus = require('os').cpus().length;
    console.log(`   🖥️  CPU Cores: ${cpus}`);
    
    if (cpus >= 4) {
      checkPassed('Sufficient CPU cores');
    } else {
      checkWarning('Limited CPU cores - may affect parallel processing');
    }

  } catch (error) {
    checkWarning('Unable to check system resources');
  }
}

// Main verification function
async function runVerification() {
  console.log('🚀 Starting comprehensive setup verification...\n');

  // Core requirements
  console.log('📋 Core Requirements:');
  checkNodeVersion();
  checkDocker();
  checkPython();
  checkGit();

  // Project structure
  console.log('\n📁 Project Structure:');
  checkRequiredFiles();
  checkEnvironmentConfig();

  // Dependencies
  console.log('\n📦 Dependencies:');
  checkDependencies();

  // Configuration
  console.log('\n⚙️  Configuration:');
  checkDockerServices();

  // System resources
  checkSystemResources();

  // Network
  checkPorts();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Verification Summary:');
  
  if (errors === 0 && warnings === 0) {
    console.log('🎉 Perfect! Your setup is ready for development.');
  } else if (errors === 0) {
    console.log(`✅ Setup is functional with ${warnings} warning(s).`);
    console.log('💡 Consider addressing warnings for optimal experience.');
  } else {
    console.log(`❌ Setup has ${errors} error(s) and ${warnings} warning(s).`);
    console.log('🔧 Please fix errors before proceeding.');
  }

  console.log('\n🚀 Next steps:');
  console.log('1. Run: npm run start-all');
  console.log('2. Wait for all services to be healthy');
  console.log('3. Visit: http://localhost:4000');
  console.log('4. Run: npm run health');

  process.exit(errors > 0 ? 1 : 0);
}

// Run verification
runVerification().catch(error => {
  console.error('\n❌ Verification failed:', error.message);
  process.exit(1);
}); 