import { FastifyRequest } from 'fastify';

declare module 'fastify' {
    interface FastifyRequest {
        user?: {
            id: string;
            email: string;
        };
    }
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: any) => Promise<void>;
    }
}
