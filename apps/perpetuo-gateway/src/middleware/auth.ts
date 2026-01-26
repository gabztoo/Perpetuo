import { FastifyRequest, FastifyReply } from 'fastify';
import { PerpetuoConfig } from '@perpetuo/core';

export class AuthMiddleware {
    constructor(private config: PerpetuoConfig) { }

    async handle(req: FastifyRequest, reply: FastifyReply) {
        const authHeader = req.headers.authorization;

        // 1. Check for API Key (Bearer)
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw { statusCode: 401, message: 'Missing or invalid Authorization header' };
        }

        const token = authHeader.split(' ')[1];

        // 2. Validate Token against Configured Tenants
        // In a real DB scenario, we'd look this up. Here config is in-memory.
        const tenant = this.config.tenants.find(t => t.apiKeys.includes(token));

        if (!tenant) {
            throw { statusCode: 403, message: 'Invalid API Key' };
        }

        // 3. Attach Tenant Info to Request (Mutation)
        // We already use x-tenant-id, but we should enforce it matches or just override it?
        // Hardening: The API Key dictates the tenant. The header x-tenant-id is useful for explicit context 
        // but MUST match the key's owner.
        const requestedTenantId = req.headers['x-tenant-id'] as string;

        if (requestedTenantId && requestedTenantId !== tenant.id) {
            throw { statusCode: 403, message: `API Key does not belong to requested tenant ${requestedTenantId}` };
        }

        // Override/Set correct tenantID
        req.headers['x-tenant-id'] = tenant.id;
        (req as any).tenant = tenant; // Attach full config for Quota Manager later
    }
}
