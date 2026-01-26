import { z } from 'zod';

export const CreateProjectSchema = z.object({
    name: z.string().min(1)
});

export const PolicyModeSchema = z.enum(['PASS_THROUGH', 'RELIABLE', 'CHEAPEST', 'CUSTOM']);

export const RouteSchema = z.object({
    key: z.string().min(1),
    displayName: z.string().optional()
});

export const PolicyRuleSchema = z.object({
    priority: z.number().int(),
    matchJson: z.record(z.any()), // Simplified for MVP
    actionJson: z.object({
        modelOrder: z.array(z.string()),
        fallbackDepth: z.number().optional(),
        retry: z.boolean().optional(),
        cache: z.boolean().optional(),
        circuitBreaker: z.boolean().optional()
    })
});

export const UpdatePolicySchema = z.object({
    mode: PolicyModeSchema,
    rules: z.array(PolicyRuleSchema)
});
