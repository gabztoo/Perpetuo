import { describe, it, expect, beforeEach } from 'vitest';
import { AutoRouter, createAutoRouter } from './autoRouter';

describe('AutoRouter', () => {
  let router: AutoRouter;

  beforeEach(() => {
    // Create router without NotDiamond API (uses heuristics)
    router = createAutoRouter({
      enabled: true,
      cacheEnabled: false, // Disable cache for tests
    });
  });

  describe('selectModel', () => {
    it('should select model using heuristics when NotDiamond is not configured', async () => {
      const result = await router.selectModel({
        messages: [{ role: 'user', content: 'What is 2 + 2?' }],
        tradeoff: 'cost',
      });

      expect(result.provider).toBeDefined();
      expect(result.model).toBeDefined();
      expect(result.reasoning).toContain('Heuristic');
      expect(result.sessionId).toContain('heuristic');
    });

    it('should select cheapest model for simple queries with cost tradeoff', async () => {
      const result = await router.selectModel({
        messages: [{ role: 'user', content: 'Hello' }],
        tradeoff: 'cost',
      });

      // Should prefer mini/haiku/flash models
      expect(
        result.model.includes('mini') ||
        result.model.includes('haiku') ||
        result.model.includes('flash') ||
        result.model.includes('mixtral')
      ).toBe(true);
    });

    it('should select fastest model for latency tradeoff', async () => {
      const result = await router.selectModel({
        messages: [{ role: 'user', content: 'Quick question' }],
        tradeoff: 'latency',
      });

      // Should prefer fast models (groq, flash, mini)
      expect(
        result.provider === 'groq' ||
        result.model.includes('flash') ||
        result.model.includes('mini')
      ).toBe(true);
    });

    it('should select quality model for complex queries', async () => {
      const result = await router.selectModel({
        messages: [{
          role: 'user',
          content: 'Explain the mathematical proof of the Riemann hypothesis step by step'
        }],
        tradeoff: 'quality',
      });

      // Should prefer quality models
      expect(
        result.model.includes('gpt-4') ||
        result.model.includes('sonnet') ||
        result.model.includes('pro')
      ).toBe(true);
    });

    it('should detect code queries as complex', async () => {
      const result = await router.selectModel({
        messages: [{
          role: 'user',
          content: '```python\ndef fibonacci(n):\n  pass\n```\nComplete this function'
        }],
        tradeoff: 'quality',
      });

      // Code queries should be routed to quality models
      expect(result.reasoning).toContain('Complex');
    });

    it('should return cost savings estimate', async () => {
      const result = await router.selectModel({
        messages: [{ role: 'user', content: 'Hi' }],
        tradeoff: 'cost',
      });

      expect(result.costSavings).toBeDefined();
      expect(typeof result.costSavings).toBe('number');
      expect(result.costSavings).toBeGreaterThanOrEqual(0);
    });

    it('should return latency estimate', async () => {
      const result = await router.selectModel({
        messages: [{ role: 'user', content: 'Test' }],
        tradeoff: 'latency',
      });

      expect(result.latencyEstimate).toBeDefined();
      expect(typeof result.latencyEstimate).toBe('number');
      expect(result.latencyEstimate).toBeGreaterThan(0);
    });
  });

  describe('caching', () => {
    it('should cache routing decisions when enabled', async () => {
      const cachedRouter = createAutoRouter({
        enabled: true,
        cacheEnabled: true,
        cacheTtlMs: 5000,
      });

      const request = {
        messages: [{ role: 'user', content: 'Same query for cache test' }],
        tradeoff: 'quality' as const,
      };

      // First call
      const result1 = await cachedRouter.selectModel(request);
      expect(result1.fromCache).toBe(false);

      // Second call (should be cached)
      const result2 = await cachedRouter.selectModel(request);
      expect(result2.fromCache).toBe(true);
      expect(result2.model).toBe(result1.model);
    });

    it('should clear cache when requested', async () => {
      const cachedRouter = createAutoRouter({
        enabled: true,
        cacheEnabled: true,
      });

      const request = {
        messages: [{ role: 'user', content: 'Cache clear test' }],
        tradeoff: 'cost' as const,
      };

      await cachedRouter.selectModel(request);
      cachedRouter.clearCache();
      
      const result = await cachedRouter.selectModel(request);
      expect(result.fromCache).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should report configured status', () => {
      expect(router.isConfigured()).toBe(true);
    });

    it('should report NotDiamond availability', () => {
      // Without API key, NotDiamond is not available
      expect(router.hasNotDiamond()).toBe(false);
    });

    it('should return default candidate models', () => {
      const models = router.getDefaultModels();
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty('provider');
      expect(models[0]).toHaveProperty('model');
    });
  });

  describe('custom candidate models', () => {
    it('should use provided candidate models', async () => {
      const customModels = [
        { provider: 'openai', model: 'gpt-4o-mini' },
        { provider: 'anthropic', model: 'claude-3-haiku-20240307' },
      ];

      const result = await router.selectModel({
        messages: [{ role: 'user', content: 'Test with custom models' }],
        candidateModels: customModels,
        tradeoff: 'cost',
      });

      // Should select from provided models
      expect(
        customModels.some(m => m.model === result.model)
      ).toBe(true);
    });
  });
});
