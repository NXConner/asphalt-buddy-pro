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

// Geocoding proxy to Nominatim with proper headers and optional contact email
server.get('/geocode', async (request, reply) => {
  const QuerySchema = z.object({ q: z.string().min(3), limit: z.string().optional() });
  const { q, limit } = QuerySchema.parse(request.query as Record<string, string>);

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', limit ?? '5');
  if (env.NOMINATIM_EMAIL) {
    url.searchParams.set('email', env.NOMINATIM_EMAIL);
  }

  const userAgent = `OverWatch/1.0 (${env.NOMINATIM_EMAIL ?? 'no-email@localhost'})`;
  const acceptLanguage = request.headers['accept-language'] ?? 'en';

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': userAgent,
      'Accept': 'application/json',
      'Accept-Language': Array.isArray(acceptLanguage) ? acceptLanguage.join(', ') : String(acceptLanguage)
    }
  });

  if (!res.ok) {
    request.log.warn({ status: res.status, statusText: res.statusText }, 'Nominatim responded with non-OK');
    return reply.code(res.status).send({ error: 'geocode_failed', status: res.status, message: res.statusText });
  }
  const data = await res.json();
  return reply.send(data);
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

