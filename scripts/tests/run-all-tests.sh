#!/bin/bash

# Master test runner - runs all test suites

set -e

echo "🧪 Plant Analytics Platform Test Suite"
echo "======================================"

# Test configuration
FAILED_TESTS=0
TOTAL_TESTS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run a test suite
run_test_suite() {
    local test_script="$1"
    local test_name="$2"
    
    echo ""
    echo -e "${YELLOW}Running $test_name...${NC}"
    echo "----------------------------------------"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ -f "$test_script" ] && [ -x "$test_script" ]; then
        if "$test_script"; then
            echo -e "${GREEN}✅ $test_name PASSED${NC}"
        else
            echo -e "${RED}❌ $test_name FAILED${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        echo -e "${RED}❌ $test_name SKIPPED (script not found or not executable)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Check if system is running
check_system_status() {
    echo "Checking system status..."
    
    if ! docker ps | grep -q "plant-analytics-postgres"; then
        echo -e "${RED}❌ System is not running. Please start the system first with: make up${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ System is running${NC}"
}

# Wait for system to be ready
wait_for_system() {
    echo "Waiting for system to be ready..."
    
    # Use our existing health check
    local retries=0
    local max_retries=30
    
    while [ $retries -lt $max_retries ]; do
        if make health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ System is healthy${NC}"
            return 0
        fi
        
        retries=$((retries + 1))
        echo "Waiting for system... ($retries/$max_retries)"
        sleep 5
    done
    
    echo -e "${RED}❌ System failed to become healthy within timeout${NC}"
    exit 1
}

# Main test execution
main() {
    echo "Starting comprehensive test suite..."
    echo ""
    
    # Pre-test checks
    check_system_status
    wait_for_system
    
    # Run test suites
    run_test_suite "scripts/tests/test-system-health.sh" "System Health Tests"
    run_test_suite "scripts/tests/test-user-seeding.sh" "User Seeding Tests"
    run_test_suite "scripts/tests/test-minio-seeding.sh" "MinIO Seeding Tests"
    run_test_suite "scripts/tests/test-integration.sh" "Integration Tests"
    
    # Summary
    echo ""
    echo "======================================"
    echo "TEST SUMMARY"
    echo "======================================"
    echo "Total test suites: $TOTAL_TESTS"
    echo "Failed test suites: $FAILED_TESTS"
    echo "Passed test suites: $((TOTAL_TESTS - FAILED_TESTS))"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
        exit 0
    else
        echo -e "${RED}❌ $FAILED_TESTS TEST SUITE(S) FAILED${NC}"
        exit 1
    fi
}

# Help message
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Plant Analytics Platform Test Suite"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --help, -h    Show this help message"
    echo ""
    echo "Prerequisites:"
    echo "  - System must be running (make up)"
    echo "  - All services must be healthy"
    echo ""
    echo "Individual test suites can be run separately:"
    echo "  ./scripts/tests/test-system-health.sh"
    echo "  ./scripts/tests/test-user-seeding.sh"
    echo "  ./scripts/tests/test-minio-seeding.sh"
    echo "  ./scripts/tests/test-integration.sh"
    exit 0
fi

main "$@"