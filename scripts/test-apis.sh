#!/bin/bash

# Test script for the 2 basic APIs
echo "🧪 Testing eGRID Analytics APIs..."
echo ""

BASE_URL="http://localhost:8000"

# Test 1: Health Check
echo "1️⃣ Testing Health Check..."
HEALTH_RESPONSE=$(curl -s "${BASE_URL}/health")
if [[ $? -eq 0 && "$HEALTH_RESPONSE" == *"healthy"* ]]; then
    echo "✅ Health check passed"
    echo "$HEALTH_RESPONSE" | python3 -m json.tool
else
    echo "❌ Health check failed"
    echo "$HEALTH_RESPONSE"
fi
echo ""

# Test 2: Get States
echo "2️⃣ Testing Get States API..."
STATES_RESPONSE=$(curl -s "${BASE_URL}/api/plants/states")
if [[ $? -eq 0 && "$STATES_RESPONSE" == *"success"* ]]; then
    echo "✅ States API passed"
    echo "$STATES_RESPONSE" | python3 -m json.tool
else
    echo "❌ States API failed"
    echo "$STATES_RESPONSE"
fi
echo ""

# Test 3: Get Top Plants
echo "3️⃣ Testing Get Top Plants API..."
TOP_PLANTS_RESPONSE=$(curl -s "${BASE_URL}/api/plants/top?limit=5")
if [[ $? -eq 0 && "$TOP_PLANTS_RESPONSE" == *"success"* ]]; then
    echo "✅ Top Plants API passed"
    echo "$TOP_PLANTS_RESPONSE" | python3 -m json.tool
else
    echo "❌ Top Plants API failed"
    echo "$TOP_PLANTS_RESPONSE"
fi
echo ""

# Test 4: Get Top Plants by State
echo "4️⃣ Testing Get Top Plants by State API..."
STATE_PLANTS_RESPONSE=$(curl -s "${BASE_URL}/api/plants/top?limit=3&state=CA")
if [[ $? -eq 0 && "$STATE_PLANTS_RESPONSE" == *"success"* ]]; then
    echo "✅ Top Plants by State API passed"
    echo "$STATE_PLANTS_RESPONSE" | python3 -m json.tool
else
    echo "❌ Top Plants by State API failed"
    echo "$STATE_PLANTS_RESPONSE"
fi
echo ""

echo "🎉 API Testing Complete!"
echo ""
echo "📊 Available endpoints:"
echo "   GET ${BASE_URL}/health"
echo "   GET ${BASE_URL}/api/plants/states"
echo "   GET ${BASE_URL}/api/plants/top?limit=N&state=XX" 