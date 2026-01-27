/**
 * ErrorClassifier
 * 
 * Classifica erros de provider em:
 * - RETRYABLE: tenta próximo provider (429, 5xx, timeout, etc)
 * - FATAL: aborta imediatamente (401, 403 da chave BYOK)
 * 
 * Isso garante que:
 * - BYOK inválida não faz tentativas desnecessárias
 * - Rate limits são respeitados (não bate provider inútil)
 * - Timeouts caem para fallback
 */

export interface ErrorClassification {
    retryable: boolean;
    statusCode: number | null;
    reason: string;
    explanation: string;
}

export class ErrorClassifier {
    /**
     * Classifica um erro vindo de um provider
     */
    classify(error: any): ErrorClassification {
        const statusCode = error.statusCode || error.status || null;
        const message = error.message || String(error);

        // FATAL: Autenticação BYOK inválida
        if (statusCode === 401) {
            return {
                retryable: false,
                statusCode,
                reason: 'BYOK_INVALID',
                explanation: 'Provider rejected API key (401). Key is invalid or revoked.',
            };
        }

        // FATAL: Proibido (pode ser limite de uso, não token)
        if (statusCode === 403) {
            // Contexto: se é um 403 com "quota exceeded" ou "billing", é permanente para este provider
            if (
                message.toLowerCase().includes('quota') ||
                message.toLowerCase().includes('billing') ||
                message.toLowerCase().includes('access denied')
            ) {
                return {
                    retryable: false,
                    statusCode,
                    reason: 'PROVIDER_QUOTA_EXCEEDED',
                    explanation: 'Provider indicates quota exceeded or access denied. Skip this provider.',
                };
            }
        }

        // RETRYABLE: Rate limit (429)
        if (statusCode === 429) {
            return {
                retryable: true,
                statusCode,
                reason: 'RATE_LIMITED',
                explanation: 'Provider rate limited (429). Try next provider.',
            };
        }

        // RETRYABLE: Server errors (5xx)
        if (statusCode && statusCode >= 500 && statusCode < 600) {
            return {
                retryable: true,
                statusCode,
                reason: 'SERVER_ERROR',
                explanation: `Provider server error (${statusCode}). Try next provider.`,
            };
        }

        // RETRYABLE: Timeout
        if (message.toLowerCase().includes('timeout') || message.includes('ETIMEDOUT')) {
            return {
                retryable: true,
                statusCode: null,
                reason: 'TIMEOUT',
                explanation: 'Request timed out. Try next provider.',
            };
        }

        // RETRYABLE: Network errors
        if (
            message.toLowerCase().includes('econnrefused') ||
            message.toLowerCase().includes('enotfound') ||
            message.toLowerCase().includes('network error')
        ) {
            return {
                retryable: true,
                statusCode: null,
                reason: 'NETWORK_ERROR',
                explanation: 'Network error. Try next provider.',
            };
        }

        // RETRYABLE: Temporary service unavailable (502, 503, 504)
        if (statusCode === 502 || statusCode === 503 || statusCode === 504) {
            return {
                retryable: true,
                statusCode,
                reason: 'SERVICE_UNAVAILABLE',
                explanation: `Provider temporarily unavailable (${statusCode}). Try next provider.`,
            };
        }

        // DEFAULT: Trata como retryable (melhor tentar outro que desistir)
        return {
            retryable: true,
            statusCode,
            reason: 'UNKNOWN_ERROR',
            explanation: `Unknown error: ${message}. Trying next provider.`,
        };
    }
}
