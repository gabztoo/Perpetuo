import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, generateAPIKey } from '../../shared/crypto';
import { sendSuccess, sendError } from '../../shared/http';

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance, prisma: PrismaClient) {
  // SIGNUP
  app.post<{ Body: z.infer<typeof SignupSchema> }>(
    '/auth/signup',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = SignupSchema.parse(request.body);

        // Check if user already exists
        const existing = await prisma.user.findUnique({
          where: { email: body.email },
        });

        if (existing) {
          return sendError(reply, 'User already exists', 409);
        }

        // Create user
        const hashedPassword = await hashPassword(body.password);
        const user = await prisma.user.create({
          data: {
            email: body.email,
            password: hashedPassword,
            name: body.name,
          },
        });

        // Create default workspace
        const workspace = await prisma.workspace.create({
          data: {
            name: 'Default Workspace',
            user_id: user.id,
          },
        });

        // Create initial API key
        const apiKey = await prisma.aPIKey.create({
          data: {
            workspace_id: workspace.id,
            user_id: user.id,
            key: generateAPIKey(),
            name: 'Default Key',
          },
        });

        // Generate JWT
        const token = app.jwt.sign(
          { sub: user.id, email: user.email },
          { expiresIn: '30d' }
        );

        return sendSuccess(reply, {
          user: { id: user.id, email: user.email, name: user.name },
          workspace: { id: workspace.id, name: workspace.name },
          api_key: apiKey.key,
          token,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendError(
            reply,
            'Invalid input: ' + error.errors[0].message,
            400
          );
        }
        console.error('Signup error:', error);
        return sendError(reply, 'Signup failed', 500);
      }
    }
  );

  // LOGIN
  app.post<{ Body: z.infer<typeof LoginSchema> }>(
    '/auth/login',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = LoginSchema.parse(request.body);

        const user = await prisma.user.findUnique({
          where: { email: body.email },
        });

        if (!user || !(await comparePassword(body.password, user.password))) {
          return sendError(reply, 'Invalid credentials', 401);
        }

        const token = app.jwt.sign(
          { sub: user.id, email: user.email },
          { expiresIn: '30d' }
        );

        return sendSuccess(reply, {
          user: { id: user.id, email: user.email, name: user.name },
          token,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendError(reply, 'Invalid input', 400);
        }
        console.error('Login error:', error);
        return sendError(reply, 'Login failed', 500);
      }
    }
  );

  // GET current user
  app.get('/auth/me', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();

      const user = await prisma.user.findUnique({
        where: { id: request.user.sub },
        select: { id: true, email: true, name: true },
      });

      if (!user) {
        return sendError(reply, 'User not found', 404);
      }

      return sendSuccess(reply, user);
    } catch (error) {
      return sendError(reply, 'Unauthorized', 401);
    }
  });
}
