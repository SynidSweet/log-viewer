#!/usr/bin/env node

/**
 * Turso Database Setup Script
 * TURSO-001 Task Automation
 * Created: 2025-07-10
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for output
const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    reset: '\x1b[0m'
};

const log = {
    info: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    step: (msg) => console.log(`${colors.yellow}🔨 ${msg}${colors.reset}`)
};

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise(resolve => rl.question(query, resolve));

// Execute command with error handling
function execCommand(command, options = {}) {
    try {
        return execSync(command, { encoding: 'utf8', ...options }).trim();
    } catch (error) {
        return null;
    }
}

// Check if command exists
function commandExists(command) {
    try {
        execSync(`which ${command}`, { stdio: 'pipe' });
        return true;
    } catch {
        return false;
    }
}

async function main() {
    console.log('🚀 Universal Log Viewer - Turso Database Setup');
    console.log('='.repeat(50));
    console.log();

    // Check if Turso CLI is installed
    if (!commandExists('turso')) {
        log.error('Turso CLI not found');
        console.log('Please install Turso CLI first:');
        console.log('  curl -sSfL https://get.tur.so/install.sh | bash');
        console.log('  source ~/.zshrc  # or ~/.bashrc');
        process.exit(1);
    }

    // Get Turso version
    const version = execCommand('turso --version');
    log.info(`Turso CLI found - ${version}`);
    console.log();

    // Check authentication
    const currentUser = execCommand('turso auth whoami');
    if (currentUser) {
        log.info(`Already authenticated as: ${currentUser}`);
    } else {
        log.warn('Authentication required');
        console.log('Please choose authentication method:');
        console.log('1. CLI authentication (recommended)');
        console.log('2. Web dashboard');
        console.log();
        
        const choice = await question('Enter choice (1-2): ');
        
        switch (choice) {
            case '1':
                console.log('Opening authentication in browser...');
                try {
                    execSync('turso auth login', { stdio: 'inherit' });
                } catch (error) {
                    log.error('Authentication failed');
                    process.exit(1);
                }
                break;
            case '2':
                console.log('Please visit: https://app.turso.tech/');
                console.log('Sign in with GitHub, then run: turso auth login');
                process.exit(0);
            default:
                log.error('Invalid choice');
                process.exit(1);
        }
    }

    console.log();

    // Database configuration
    const DB_NAME = 'log-viewer';
    const DEFAULT_LOCATION = 'fra'; // Frankfurt, Germany

    log.step('Database Configuration');
    console.log(`Database name: ${DB_NAME}`);
    console.log('Available locations: fra, lax, nrt, syd, bos, sin');
    console.log();

    const location = await question(`Enter database location [${DEFAULT_LOCATION}]: `) || DEFAULT_LOCATION;

    // Check if database exists
    const dbExists = execCommand(`turso db show ${DB_NAME} --url`);
    if (dbExists) {
        log.info(`Database '${DB_NAME}' already exists`);
        console.log('Skipping database creation...');
    } else {
        log.step('Creating database...');
        const createResult = execCommand(`turso db create ${DB_NAME} --location ${location}`);
        if (createResult !== null) {
            log.info('Database created successfully');
        } else {
            log.error('Failed to create database');
            process.exit(1);
        }
    }

    console.log();

    // Get database information
    log.step('Retrieving database information...');
    
    const dbUrl = execCommand(`turso db show ${DB_NAME} --url`);
    if (!dbUrl) {
        log.error('Failed to get database URL');
        process.exit(1);
    }

    // Generate auth token
    log.step('Generating authentication token...');
    const authToken = execCommand(`turso db tokens create ${DB_NAME}`);
    if (!authToken) {
        log.error('Failed to generate auth token');
        process.exit(1);
    }

    log.info('Database configured successfully');
    console.log();

    // Create environment file
    const ENV_FILE = '.env.local';
    log.step('Environment Configuration');

    if (fs.existsSync(ENV_FILE)) {
        const backupFile = `${ENV_FILE}.backup.${Date.now()}`;
        fs.copyFileSync(ENV_FILE, backupFile);
        console.log(`Backed up existing ${ENV_FILE} to ${backupFile}`);
    }

    console.log(`Creating ${ENV_FILE} with Turso configuration...`);

    // Read existing .env.local or create from template
    let envContent = '';
    if (fs.existsSync(ENV_FILE)) {
        envContent = fs.readFileSync(ENV_FILE, 'utf8');
        
        // Update existing entries
        if (envContent.includes('TURSO_DATABASE_URL')) {
            envContent = envContent.replace(/TURSO_DATABASE_URL=.*/, `TURSO_DATABASE_URL=${dbUrl}`);
        } else {
            envContent += `\n# Turso Database Configuration\nTURSO_DATABASE_URL=${dbUrl}\n`;
        }
        
        if (envContent.includes('TURSO_AUTH_TOKEN')) {
            envContent = envContent.replace(/TURSO_AUTH_TOKEN=.*/, `TURSO_AUTH_TOKEN=${authToken}`);
        } else {
            envContent += `TURSO_AUTH_TOKEN=${authToken}\n`;
        }
    } else {
        // Create new file from template
        envContent = `# NextAuth.js Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Access Restriction (Optional)
# ALLOWED_EMAILS=user1@example.com,user2@example.com
# ALLOWED_DOMAINS=company.com,myorg.org

# Turso Database Configuration
TURSO_DATABASE_URL=${dbUrl}
TURSO_AUTH_TOKEN=${authToken}
`;
    }

    fs.writeFileSync(ENV_FILE, envContent);
    log.info('Environment file configured');
    console.log();

    // Test database connection
    log.step('Testing Database Connection');
    const testResult = execCommand(`turso db shell ${DB_NAME} --execute "SELECT 1 as test;"`);
    if (testResult !== null) {
        log.info('Database connection successful');
    } else {
        log.error('Database connection failed');
        console.log('Please check the configuration and try again.');
        process.exit(1);
    }

    console.log();

    // Summary
    console.log(`${colors.green}🎉 Setup Complete!${colors.reset}`);
    console.log('='.repeat(50));
    console.log(`Database Name: ${DB_NAME}`);
    console.log(`Database URL:  ${dbUrl}`);
    console.log(`Location:      ${location}`);
    console.log(`Environment:   ${ENV_FILE}`);
    console.log();

    console.log(`${colors.yellow}Next Steps:${colors.reset}`);
    console.log(`1. Configure your Google OAuth credentials in ${ENV_FILE}`);
    console.log(`2. Run 'npm run dev' to start the development server`);
    console.log(`3. Visit http://localhost:3000/api/health to verify database health`);
    console.log(`4. The application will automatically create the required tables`);
    console.log();

    console.log(`${colors.yellow}Security Note:${colors.reset}`);
    console.log(`⚠️  Keep your auth token secure and never commit it to version control`);
    console.log(`⚠️  The token has been added to ${ENV_FILE} which should be in .gitignore`);
    console.log();

    console.log(`${colors.green}TURSO-001 Task Completed Successfully! ✅${colors.reset}`);
    console.log('You can now proceed with the remaining migration tasks.');

    rl.close();
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n\nSetup interrupted by user');
    rl.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\nSetup terminated');
    rl.close();
    process.exit(0);
});

// Run the main function
main().catch(error => {
    console.error('\n' + colors.red + '❌ Setup failed:', error.message + colors.reset);
    rl.close();
    process.exit(1);
});