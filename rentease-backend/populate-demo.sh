#!/bin/bash

echo "🚀 Populating demo account with comprehensive data..."
echo ""

# Run the population script
node populate-demo-account.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully populated demo account!"
    echo ""
    echo "You can now login with:"
    echo "  Email: mo@gmail.com"
    echo "  Password: 123456"
    echo ""
else
    echo ""
    echo "❌ Failed to populate demo account"
    echo "Please check the error messages above"
    exit 1
fi

