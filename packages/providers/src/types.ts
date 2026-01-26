import { ChatParams, ChatResponse, ProviderConfig } from '@perpetuo/core';

export interface ProviderContext {
    apiKey: string;
    requestId: string;
    tenantId: string;
}

export interface IChatProvider {
    name: string;
    invoke(params: ChatParams, config: ProviderConfig, context: ProviderContext): Promise<ChatResponse>;
}
