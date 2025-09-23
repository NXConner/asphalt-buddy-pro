import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import { z } from 'zod';
import { loadEnv } from './env.js';
import { prisma } from '@acme/db';
import { redis } from './redis.js';
import { initTelemetry } from './telemetry.js';

// Initialize env and telemetry upfront
const env = loadEnv();
await initTelemetry();

const server = Fastify({
  logger: {
    level: env.LOG_LEVEL,
    transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined
  }
});

await server.register(cors, { origin: true });
await server.register(helmet);
await server.register(sensible);

server.get('/health', async () => ({ status: 'ok' }));

server.post('/echo', async (request) => {
  const schema = z.object({ message: z.string().min(1) });
  const body = schema.parse(request.body);
  return { echo: body.message };
});

server.get('/users', async () => {
  const users = await prisma.user.findMany({ take: 50, orderBy: { createdAt: 'desc' } });
  return { users };
});

server.get('/health/deps', async () => {
  const dbOk = await prisma.$queryRaw`SELECT 1`;
  const redisOk = await redis.ping();
  return { db: 'ok', redis: redisOk };
});

const port = Number(env.PORT);
const host = env.HOST;

server
  .listen({ port, host })
  .then((address) => {
    server.log.info({ address }, 'API listening');
  })
  .catch((err) => {
    server.log.error(err, 'Failed to start');
    process.exit(1);
  });

