#!/bin/bash

# Turso Database Setup Script
# TURSO-001 Task Automation
# Created: 2025-07-10

set -e

echo "🚀 Universal Log Viewer - Turso Database Setup"
echo "=============================================="
echo

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Turso CLI is installed
if ! command -v turso &> /dev/null; then
    echo -e "${RED}❌ Turso CLI not found${NC}"
    echo "Please install Turso CLI first:"
    echo "  curl -sSfL https://get.tur.so/install.sh | bash"
    echo "  source ~/.zshrc  # or ~/.bashrc"
    exit 1
fi

echo -e "${GREEN}✅ Turso CLI found${NC}"
echo "Version: $(turso --version)"
echo

# Check if already authenticated
if turso auth whoami &> /dev/null; then
    echo -e "${GREEN}✅ Already authenticated with Turso${NC}"
    echo "User: $(turso auth whoami)"
else
    echo -e "${YELLOW}🔐 Authentication required${NC}"
    echo "Please choose authentication method:"
    echo "1. CLI authentication (recommended)"
    echo "2. Web dashboard"
    echo
    read -p "Enter choice (1-2): " choice
    
    case $choice in
        1)
            echo "Opening authentication in browser..."
            turso auth login
            ;;
        2)
            echo "Please visit: https://app.turso.tech/"
            echo "Sign in with GitHub, then run: turso auth login"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
fi

echo

# Database configuration
DB_NAME="log-viewer"
DEFAULT_LOCATION="fra"  # Frankfurt, Germany

echo -e "${YELLOW}📊 Database Configuration${NC}"
echo "Database name: $DB_NAME"
echo "Available locations: fra, lax, nrt, syd, bos, sin"
echo

read -p "Enter database location [$DEFAULT_LOCATION]: " location
location=${location:-$DEFAULT_LOCATION}

# Check if database already exists
if turso db show $DB_NAME &> /dev/null; then
    echo -e "${GREEN}✅ Database '$DB_NAME' already exists${NC}"
    echo "Skipping database creation..."
else
    echo -e "${YELLOW}🔨 Creating database...${NC}"
    turso db create $DB_NAME --location $location
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database created successfully${NC}"
    else
        echo -e "${RED}❌ Failed to create database${NC}"
        exit 1
    fi
fi

echo

# Get database information
echo -e "${YELLOW}📝 Database Information${NC}"
echo "Getting database URL and creating auth token..."
echo

# Get database URL
DB_URL=$(turso db show $DB_NAME --url)
if [ -z "$DB_URL" ]; then
    echo -e "${RED}❌ Failed to get database URL${NC}"
    exit 1
fi

# Generate auth token
echo "Generating authentication token..."
AUTH_TOKEN=$(turso db tokens create $DB_NAME)
if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${RED}❌ Failed to generate auth token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Database configured successfully${NC}"
echo

# Create environment file
ENV_FILE=".env.local"
echo -e "${YELLOW}⚙️  Environment Configuration${NC}"

if [ -f "$ENV_FILE" ]; then
    echo "Backing up existing $ENV_FILE..."
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
fi

echo "Creating $ENV_FILE with Turso configuration..."

# Read existing .env.local or create from template
if [ -f "$ENV_FILE" ]; then
    # Update existing file
    if grep -q "TURSO_DATABASE_URL" "$ENV_FILE"; then
        sed -i.tmp "s|TURSO_DATABASE_URL=.*|TURSO_DATABASE_URL=$DB_URL|" "$ENV_FILE"
        rm "$ENV_FILE.tmp"
    else
        echo "" >> "$ENV_FILE"
        echo "# Turso Database Configuration" >> "$ENV_FILE"
        echo "TURSO_DATABASE_URL=$DB_URL" >> "$ENV_FILE"
    fi
    
    if grep -q "TURSO_AUTH_TOKEN" "$ENV_FILE"; then
        sed -i.tmp "s|TURSO_AUTH_TOKEN=.*|TURSO_AUTH_TOKEN=$AUTH_TOKEN|" "$ENV_FILE"
        rm "$ENV_FILE.tmp"
    else
        echo "TURSO_AUTH_TOKEN=$AUTH_TOKEN" >> "$ENV_FILE"
    fi
else
    # Create new file from template
    cat > "$ENV_FILE" << EOF
# NextAuth.js Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Access Restriction (Optional)
# ALLOWED_EMAILS=user1@example.com,user2@example.com
# ALLOWED_DOMAINS=company.com,myorg.org

# Turso Database Configuration
TURSO_DATABASE_URL=$DB_URL
TURSO_AUTH_TOKEN=$AUTH_TOKEN
EOF
fi

echo -e "${GREEN}✅ Environment file configured${NC}"
echo

# Test database connection
echo -e "${YELLOW}🔍 Testing Database Connection${NC}"
echo "Connecting to database..."

if turso db shell $DB_NAME --execute "SELECT 1 as test;" &> /dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    echo "Please check the configuration and try again."
    exit 1
fi

echo

# Summary
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "=============================================="
echo "Database Name: $DB_NAME"
echo "Database URL:  $DB_URL"
echo "Location:      $location"
echo "Environment:   $ENV_FILE"
echo

echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure your Google OAuth credentials in $ENV_FILE"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:3000/api/health to verify database health"
echo "4. The application will automatically create the required tables"
echo

echo -e "${YELLOW}Security Note:${NC}"
echo "⚠️  Keep your auth token secure and never commit it to version control"
echo "⚠️  The token has been added to $ENV_FILE which should be in .gitignore"
echo

echo -e "${GREEN}TURSO-001 Task Completed Successfully! ✅${NC}"
echo "You can now proceed with the remaining migration tasks."