// Test script for Auto Router functionality
// Run with: npx tsx test-auto-router.ts

import { AutoRouter, createAutoRouter } from './packages/core/src/resolvers/autoRouter';

async function testAutoRouter() {
  console.log('🧪 Testing Auto Router...\n');

  // Create router (without NotDiamond API for heuristic testing)
  const router = createAutoRouter({
    enabled: true,
    cacheEnabled: true,
    cacheTtlMs: 60000,
    fallbackModel: 'gpt-4-turbo',
  });

  // Test 1: Simple query with cost optimization
  console.log('📋 Test 1: Simple query (cost optimization)');
  const result1 = await router.selectModel({
    messages: [{ role: 'user', content: 'What is the capital of France?' }],
    tradeoff: 'cost',
  });
  console.log(`   Provider: ${result1.provider}`);
  console.log(`   Model: ${result1.model}`);
  console.log(`   Reasoning: ${result1.reasoning}`);
  console.log(`   Cost Savings: ${result1.costSavings}%`);
  console.log(`   From Cache: ${result1.fromCache}\n`);

  // Test 2: Complex query with quality optimization
  console.log('📋 Test 2: Complex query (quality optimization)');
  const result2 = await router.selectModel({
    messages: [{ 
      role: 'user', 
      content: 'Explain the mathematical proof of the Riemann hypothesis step by step with examples' 
    }],
    tradeoff: 'quality',
  });
  console.log(`   Provider: ${result2.provider}`);
  console.log(`   Model: ${result2.model}`);
  console.log(`   Reasoning: ${result2.reasoning}`);
  console.log(`   Cost Savings: ${result2.costSavings}%`);
  console.log(`   From Cache: ${result2.fromCache}\n`);

  // Test 3: Code query with latency optimization
  console.log('📋 Test 3: Code query (latency optimization)');
  const result3 = await router.selectModel({
    messages: [{ 
      role: 'user', 
      content: '```python\ndef fibonacci(n):\n  pass\n```\nComplete this function with dynamic programming' 
    }],
    tradeoff: 'latency',
  });
  console.log(`   Provider: ${result3.provider}`);
  console.log(`   Model: ${result3.model}`);
  console.log(`   Reasoning: ${result3.reasoning}`);
  console.log(`   Latency Estimate: ${result3.latencyEstimate}ms`);
  console.log(`   From Cache: ${result3.fromCache}\n`);

  // Test 4: Cache test (same query should hit cache)
  console.log('📋 Test 4: Cache test (repeat query 1)');
  const result4 = await router.selectModel({
    messages: [{ role: 'user', content: 'What is the capital of France?' }],
    tradeoff: 'cost',
  });
  console.log(`   From Cache: ${result4.fromCache} (should be true)`);
  console.log(`   Model: ${result4.model}\n`);

  // Test 5: Custom candidate models
  console.log('📋 Test 5: Custom candidate models');
  const result5 = await router.selectModel({
    messages: [{ role: 'user', content: 'Write a haiku about programming' }],
    tradeoff: 'quality',
    candidateModels: [
      { provider: 'openai', model: 'gpt-4o-mini' },
      { provider: 'anthropic', model: 'claude-3-haiku-20240307' },
    ],
  });
  console.log(`   Provider: ${result5.provider}`);
  console.log(`   Model: ${result5.model}`);
  console.log(`   Reasoning: ${result5.reasoning}\n`);

  // Test 6: Configuration checks
  console.log('📋 Test 6: Configuration status');
  console.log(`   Router Enabled: ${router.isConfigured()}`);
  console.log(`   NotDiamond Available: ${router.hasNotDiamond()}`);
  console.log(`   Default Models: ${router.getDefaultModels().length} models\n`);

  // Summary
  console.log('✅ All Auto Router tests completed!');
  console.log('\n🚀 Usage in API:');
  console.log(`   POST /v1/chat/completions`);
  console.log(`   {`);
  console.log(`     "model": "auto",  // or "best" or "router"`);
  console.log(`     "routing_preference": "quality",  // or "cost" or "latency"`);
  console.log(`     "messages": [...]`);
  console.log(`   }`);
  console.log('\n📊 Response includes:');
  console.log(`   "x-perpetuo-routing-decision": {`);
  console.log(`     "selected_provider": "${result1.provider}",`);
  console.log(`     "selected_model": "${result1.model}",`);
  console.log(`     "reasoning": "${result1.reasoning}",`);
  console.log(`     "cost_savings_percent": ${result1.costSavings}`);
  console.log(`   }`);
}

testAutoRouter().catch(console.error);
