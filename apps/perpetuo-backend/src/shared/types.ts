// Tipos globais do sistema
export interface AuthRequest {
  user?: {
    id: string;
    email: string;
  };
  workspace?: {
    id: string;
  };
}

export type APIResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = APIResponse<{
  items: T[];
  total: number;
  page: number;
  limit: number;
}>;

// Providers suportados
export const SUPPORTED_PROVIDERS = [
  'openai',
  'anthropic',
  'google',
  'cohere',
  'mistral'
] as const;

export type Provider = (typeof SUPPORTED_PROVIDERS)[number];

// Mensagens de erro padrão
export const ErrorMessages = {
  UNAUTHORIZED: 'Unauthorized',
  INVALID_API_KEY: 'Invalid API key',
  WORKSPACE_NOT_FOUND: 'Workspace not found',
  NO_ACTIVE_PROVIDERS: 'No active providers configured',
  PROVIDER_ERROR: 'Provider returned an error',
  RATE_LIMITED: 'Rate limit exceeded',
  INVALID_REQUEST: 'Invalid request',
} as const;
