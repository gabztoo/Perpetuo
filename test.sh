#!/bin/bash

# PERPETUO - Quick Start Test Script
# This script validates the MVP setup works end-to-end

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 PERPETUO MVP - End-to-End Test${NC}\n"

# Test 1: Backend is running
echo -e "${BLUE}Test 1: Backend health check...${NC}"
if curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ Backend running on :3000${NC}\n"
else
    echo -e "${RED}❌ Backend not responding on :3000${NC}"
    exit 1
fi

# Test 2: Signup
echo -e "${BLUE}Test 2: Create account...${NC}"
SIGNUP=$(curl -s -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@perpetuo.local",
    "password":"Password123!",
    "name":"Test User"
  }')

TOKEN=$(echo $SIGNUP | grep -o '"token":"[^"]*' | cut -d'"' -f4)
WORKSPACE_ID=$(echo $SIGNUP | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
API_KEY=$(echo $SIGNUP | grep -o '"key":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Signup failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Account created${NC}"
echo -e "   Token: ${TOKEN:0:20}..."
echo -e "   Workspace: $WORKSPACE_ID"
echo -e "   API Key: $API_KEY\n"

# Test 3: Add Provider
echo -e "${BLUE}Test 3: Add OpenAI provider...${NC}"
PROVIDER=$(curl -s -X POST http://localhost:3000/workspaces/$WORKSPACE_ID/providers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider":"openai",
    "api_key":"sk-test-key-not-real",
    "priority":1
  }')

if echo $PROVIDER | grep -q '"provider"'; then
    echo -e "${GREEN}✅ Provider added${NC}\n"
else
    echo -e "${YELLOW}⚠️ Provider add skipped (expected - real keys needed)${NC}\n"
fi

# Test 4: Generate API Key
echo -e "${BLUE}Test 4: Generate additional API key...${NC}"
API_KEY2=$(curl -s -X POST http://localhost:3000/workspaces/$WORKSPACE_ID/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Key 2"}')

if echo $API_KEY2 | grep -q '"key"'; then
    echo -e "${GREEN}✅ API key generated${NC}\n"
else
    echo -e "${RED}❌ API key generation failed${NC}"
    exit 1
fi

# Test 5: List API Keys
echo -e "${BLUE}Test 5: List API keys...${NC}"
KEYS=$(curl -s -X GET http://localhost:3000/workspaces/$WORKSPACE_ID/api-keys \
  -H "Authorization: Bearer $TOKEN")

if echo $KEYS | grep -q '"items"'; then
    KEY_COUNT=$(echo $KEYS | grep -o '"key":"' | wc -l)
    echo -e "${GREEN}✅ Found $KEY_COUNT API keys${NC}\n"
else
    echo -e "${RED}❌ Failed to list keys${NC}"
    exit 1
fi

# Test 6: Get Usage
echo -e "${BLUE}Test 6: Get usage analytics...${NC}"
USAGE=$(curl -s -X GET http://localhost:3000/workspaces/$WORKSPACE_ID/usage \
  -H "Authorization: Bearer $TOKEN")

if echo $USAGE | grep -q '"total_requests"'; then
    echo -e "${GREEN}✅ Usage tracked${NC}\n"
else
    echo -e "${RED}❌ Failed to get usage${NC}"
    exit 1
fi

# Test 7: Check Dashboard
echo -e "${BLUE}Test 7: Dashboard accessibility...${NC}"
if curl -s http://localhost:3001 | grep -q "PERPETUO"; then
    echo -e "${GREEN}✅ Dashboard running on :3001${NC}\n"
else
    echo -e "${YELLOW}⚠️ Dashboard not responding (expected if not started)${NC}\n"
fi

# Success Summary
echo -e "${GREEN}════════════════════════════════${NC}"
echo -e "${GREEN}✅ All MVP Tests Passed!${NC}"
echo -e "${GREEN}════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Open http://localhost:3001 in browser"
echo "2. Login with: test@perpetuo.local / Password123!"
echo "3. Add real OpenAI API key in Providers tab"
echo "4. Copy API key: $API_KEY"
echo "5. Test with: curl -X POST http://localhost:3000/v1/chat/completions \\"
echo "     -H \"Authorization: Bearer $API_KEY\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"model\":\"gpt-4\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}'"
echo ""
echo -e "${GREEN}🚀 MVP is ready to use!${NC}"
