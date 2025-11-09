#!/bin/bash

# DocuSeal Workflow Test Runner
# This script makes it easy to test the DocuSeal integration

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║       DocuSeal Workflow Test Runner                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found${NC}"
    echo "Creating .env from .env.template..."
    cp .env.template .env 2>/dev/null || echo "No .env.template found"
fi

# Check if DOCUSEAL_API_KEY is set
if ! grep -q "DOCUSEAL_API_KEY=.*[^_here]$" .env 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: DOCUSEAL_API_KEY not configured in .env${NC}"
    echo "Some tests will be skipped. To fully test DocuSeal:"
    echo "1. Get API key from: https://console.docuseal.com/api"
    echo "2. Add to .env: DOCUSEAL_API_KEY=your_key_here"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if server is running
echo -e "${BLUE}Checking if server is running...${NC}"
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server is not running${NC}"
    echo "Please start the server first:"
    echo "  npm start"
    echo ""
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Run the test
echo -e "${BLUE}Running DocuSeal workflow tests...${NC}"
echo ""

node test-docuseal-workflow.js

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ All tests completed successfully!                     ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Check email: mohamed.elnahhas@icloud.com"
    echo "2. Look for email from DocuSeal"
    echo "3. Click signing link and sign the document"
    echo "4. Webhook will automatically update the database"
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo "  npm run db:studio   # View database"
    echo "  npm run test:docuseal # Run tests again"
    echo ""
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ Some tests failed                                     ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Check the output above for error details."
    echo ""
    exit 1
fi

