import { TenantConfig } from '@perpetuo/core';

declare module 'fastify' {
    interface FastifyRequest {
        tenant?: TenantConfig;
        user?: {
            id: string;
            email: string;
            // add other user props
        };
    }
}
