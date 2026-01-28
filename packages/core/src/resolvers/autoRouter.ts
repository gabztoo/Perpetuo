// Auto Router using NotDiamond for intelligent model selection
// This module selects the best LLM based on query analysis
// Tradeoffs: quality (default), cost, latency

export interface AutoRouterConfig {
  apiKey: string;
  enabled: boolean;
  defaultTradeoff: 'quality' | 'cost' | 'latency';
  cacheEnabled: boolean;
  cacheTtlMs: number;
  fallbackModel: string;
}

export interface AutoRouterRequest {
  messages: Array<{ role: string; content: string }>;
  tradeoff?: 'quality' | 'cost' | 'latency';
  candidateModels?: Array<{ provider: string; model: string }>;
  preferenceId?: string; // For custom trained router
}

export interface AutoRouterResult {
  provider: string;
  model: string;
  sessionId: string;
  reasoning: string;
  tradeoff: string;
  costSavings?: number;
  latencyEstimate?: number;
  fromCache: boolean;
  timestamp: number;
}

// Default models to route between (can be overridden per request)
const DEFAULT_CANDIDATE_MODELS = [
  { provider: 'openai', model: 'gpt-4-turbo' },
  { provider: 'openai', model: 'gpt-4o-mini' },
  { provider: 'anthropic', model: 'claude-3-5-sonnet-latest' },
  { provider: 'anthropic', model: 'claude-3-haiku-20240307' },
  { provider: 'google', model: 'gemini-1.5-pro' },
  { provider: 'google', model: 'gemini-1.5-flash' },
  { provider: 'groq', model: 'mixtral-8x7b-32768' },
  { provider: 'groq', model: 'llama-3.1-70b-versatile' },
];

// Cost per 1K tokens (input + output average) for cost estimation
const MODEL_COSTS: Record<string, number> = {
  'gpt-4-turbo': 0.04,
  'gpt-4o-mini': 0.0003,
  'claude-3-5-sonnet-latest': 0.009,
  'claude-3-haiku-20240307': 0.0008,
  'gemini-1.5-pro': 0.007,
  'gemini-1.5-flash': 0.0003,
  'mixtral-8x7b-32768': 0.0007,
  'llama-3.1-70b-versatile': 0.0008,
};

// Latency estimates in ms (p95)
const MODEL_LATENCY: Record<string, number> = {
  'gpt-4-turbo': 1500,
  'gpt-4o-mini': 400,
  'claude-3-5-sonnet-latest': 1000,
  'claude-3-haiku-20240307': 300,
  'gemini-1.5-pro': 800,
  'gemini-1.5-flash': 200,
  'mixtral-8x7b-32768': 150,
  'llama-3.1-70b-versatile': 250,
};

// Simple in-memory cache for routing decisions
const routingCache = new Map<string, { result: AutoRouterResult; expiresAt: number }>();

export class AutoRouter {
  private config: AutoRouterConfig;
  private notDiamondAvailable: boolean = false;

  constructor(config: Partial<AutoRouterConfig> = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.NOTDIAMOND_API_KEY || '',
      enabled: config.enabled ?? true,
      defaultTradeoff: config.defaultTradeoff || 'quality',
      cacheEnabled: config.cacheEnabled ?? true,
      cacheTtlMs: config.cacheTtlMs || 60000, // 1 minute cache
      fallbackModel: config.fallbackModel || 'gpt-4-turbo',
    };

    // Check if NotDiamond API is available
    this.notDiamondAvailable = !!this.config.apiKey && this.config.apiKey.length > 10;
  }

  /**
   * Select the best model for a given request
   * Uses NotDiamond API if available, otherwise falls back to heuristic selection
   */
  async selectModel(request: AutoRouterRequest): Promise<AutoRouterResult> {
    const tradeoff = request.tradeoff || this.config.defaultTradeoff;
    const candidateModels = request.candidateModels || DEFAULT_CANDIDATE_MODELS;
    const startTime = Date.now();

    // Check cache first
    if (this.config.cacheEnabled) {
      const cacheKey = this.generateCacheKey(request);
      const cached = routingCache.get(cacheKey);
      
      if (cached && cached.expiresAt > Date.now()) {
        return {
          ...cached.result,
          fromCache: true,
        };
      }
    }

    let result: AutoRouterResult;

    if (this.notDiamondAvailable) {
      try {
        result = await this.selectWithNotDiamond(request, tradeoff, candidateModels);
      } catch (error) {
        console.warn('NotDiamond API failed, using heuristic selection:', error);
        result = this.selectWithHeuristics(request, tradeoff, candidateModels);
      }
    } else {
      // Use heuristic selection when NotDiamond is not configured
      result = this.selectWithHeuristics(request, tradeoff, candidateModels);
    }

    // Cache the result
    if (this.config.cacheEnabled) {
      const cacheKey = this.generateCacheKey(request);
      routingCache.set(cacheKey, {
        result,
        expiresAt: Date.now() + this.config.cacheTtlMs,
      });
    }

    return result;
  }

  /**
   * Select model using NotDiamond API
   * This is the "real" intelligent routing
   */
  private async selectWithNotDiamond(
    request: AutoRouterRequest,
    tradeoff: string,
    candidateModels: Array<{ provider: string; model: string }>
  ): Promise<AutoRouterResult> {
    // Dynamic import to avoid bundling issues
    const { default: fetch } = await import('node-fetch');

    const response = await fetch('https://api.notdiamond.ai/v1/model-router/select', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: request.messages,
        llm_providers: candidateModels,
        tradeoff: tradeoff === 'quality' ? undefined : tradeoff,
        preference_id: request.preferenceId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NotDiamond API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as {
      session_id: string;
      provider: { provider: string; model: string };
    };

    const selectedModel = data.provider.model;
    const baseCost = MODEL_COSTS[this.config.fallbackModel] || 0.04;
    const selectedCost = MODEL_COSTS[selectedModel] || 0.01;
    const costSavings = Math.max(0, (baseCost - selectedCost) / baseCost);

    return {
      provider: data.provider.provider,
      model: selectedModel,
      sessionId: data.session_id,
      reasoning: `NotDiamond selected ${data.provider.model} optimizing for ${tradeoff}`,
      tradeoff,
      costSavings: Math.round(costSavings * 100),
      latencyEstimate: MODEL_LATENCY[selectedModel] || 500,
      fromCache: false,
      timestamp: Date.now(),
    };
  }

  /**
   * Fallback heuristic selection when NotDiamond is not available
   * Uses simple rules based on query characteristics
   */
  private selectWithHeuristics(
    request: AutoRouterRequest,
    tradeoff: string,
    candidateModels: Array<{ provider: string; model: string }>
  ): AutoRouterResult {
    const queryText = request.messages.map(m => m.content).join(' ');
    const queryLength = queryText.length;
    const wordCount = queryText.split(/\s+/).length;

    let selectedModel: { provider: string; model: string };
    let reasoning: string;

    // Analyze query complexity
    const isComplex = this.analyzeComplexity(queryText);

    switch (tradeoff) {
      case 'cost':
        // Prefer cheapest models for simple queries
        if (isComplex) {
          // Use mid-tier for complex queries
          selectedModel = candidateModels.find(m => 
            m.model.includes('sonnet') || m.model.includes('flash')
          ) || candidateModels[0];
          reasoning = 'Complex query routed to mid-tier model for cost efficiency';
        } else {
          // Use cheapest for simple queries
          selectedModel = candidateModels.find(m =>
            m.model.includes('mini') || m.model.includes('haiku') || m.model.includes('flash')
          ) || candidateModels[0];
          reasoning = 'Simple query routed to cheapest model';
        }
        break;

      case 'latency':
        // Prefer fastest models
        selectedModel = candidateModels.find(m =>
          m.provider === 'groq' || m.model.includes('flash') || m.model.includes('mini')
        ) || candidateModels[0];
        reasoning = 'Query routed to fastest model for low latency';
        break;

      case 'quality':
      default:
        // Prefer best quality models
        if (isComplex) {
          selectedModel = candidateModels.find(m =>
            m.model.includes('gpt-4-turbo') || 
            m.model.includes('claude-3-5-sonnet') ||
            m.model.includes('gemini-1.5-pro')
          ) || candidateModels[0];
          reasoning = 'Complex query routed to highest quality model';
        } else {
          selectedModel = candidateModels.find(m =>
            m.model.includes('gpt-4o-mini') || m.model.includes('sonnet')
          ) || candidateModels[0];
          reasoning = 'Simple query routed to efficient high-quality model';
        }
        break;
    }

    const baseCost = MODEL_COSTS[this.config.fallbackModel] || 0.04;
    const selectedCost = MODEL_COSTS[selectedModel.model] || 0.01;
    const costSavings = Math.max(0, (baseCost - selectedCost) / baseCost);

    return {
      provider: selectedModel.provider,
      model: selectedModel.model,
      sessionId: `heuristic-${Date.now()}`,
      reasoning: `[Heuristic] ${reasoning}`,
      tradeoff,
      costSavings: Math.round(costSavings * 100),
      latencyEstimate: MODEL_LATENCY[selectedModel.model] || 500,
      fromCache: false,
      timestamp: Date.now(),
    };
  }

  /**
   * Analyze query complexity using simple heuristics
   */
  private analyzeComplexity(query: string): boolean {
    const wordCount = query.split(/\s+/).length;
    
    // Complex indicators
    const hasCodeIndicators = /```|function|class|def |import |const |var |let |=>/.test(query);
    const hasMathIndicators = /\d+[+\-*/]\d+|equation|calculate|solve|derive/.test(query);
    const hasReasoningIndicators = /explain|analyze|compare|evaluate|why|how does|step by step/.test(query.toLowerCase());
    const hasCreativeIndicators = /write|create|design|develop|build|story|essay/.test(query.toLowerCase());
    
    const complexityScore = 
      (hasCodeIndicators ? 2 : 0) +
      (hasMathIndicators ? 2 : 0) +
      (hasReasoningIndicators ? 1 : 0) +
      (hasCreativeIndicators ? 1 : 0) +
      (wordCount > 100 ? 1 : 0) +
      (wordCount > 300 ? 1 : 0);

    return complexityScore >= 2;
  }

  /**
   * Generate cache key based on request content
   */
  private generateCacheKey(request: AutoRouterRequest): string {
    // Simple hash of messages + tradeoff
    const content = request.messages.map(m => m.content).join('|');
    const tradeoff = request.tradeoff || this.config.defaultTradeoff;
    
    // Use first 100 chars + tradeoff as cache key
    return `${content.substring(0, 100)}:${tradeoff}`;
  }

  /**
   * Check if Auto Router is properly configured
   */
  isConfigured(): boolean {
    return this.config.enabled;
  }

  /**
   * Check if NotDiamond API is available
   */
  hasNotDiamond(): boolean {
    return this.notDiamondAvailable;
  }

  /**
   * Get default candidate models
   */
  getDefaultModels(): Array<{ provider: string; model: string }> {
    return [...DEFAULT_CANDIDATE_MODELS];
  }

  /**
   * Clear routing cache
   */
  clearCache(): void {
    routingCache.clear();
  }
}

// Export singleton instance
export const autoRouter = new AutoRouter();

// Export function to create custom instance
export function createAutoRouter(config: Partial<AutoRouterConfig>): AutoRouter {
  return new AutoRouter(config);
}
