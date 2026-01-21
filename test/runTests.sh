#!/bin/bash

# ========================================
# TEST RUNNER SCRIPT
# ========================================

echo "Starting Work Before Play Extension Tests..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "Node.js version:"
node --version
echo ""

# Run background tests
echo "Running Background Worker Tests..."
node test/backgroundTest.js
echo ""

# Run popup tests
echo "Running Popup Controller Tests..."
node test/popupTest.js
echo ""

echo "✓ All tests completed!"
