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

// Asphalt detection via Overpass, with bbox validation, caching, and simple rate limiting
server.post('/asphalt/detect', async (request, reply) => {
  const BodySchema = z.object({
    bbox: z.object({
      south: z.number().min(-90).max(90),
      west: z.number().min(-180).max(180),
      north: z.number().min(-90).max(90),
      east: z.number().min(-180).max(180)
    }),
    includeParking: z.boolean().default(true),
    timeoutMs: z.number().min(1000).max(20000).default(10000)
  });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(request.body);
  } catch (err: any) {
    return reply.code(400).send({ error: 'bad_request', message: err?.message ?? 'Invalid body' });
  }

  // Basic per-IP rate limit: 30 requests per minute
  try {
    const ip = request.ip || 'unknown';
    const rlKey = `rl:asphalt:${ip}`;
    const count = await redis.incr(rlKey);
    if (count === 1) {
      await redis.expire(rlKey, 60);
    }
    if (count > 30) {
      return reply.code(429).send({ error: 'rate_limited', message: 'Too many requests' });
    }
  } catch {}

  const { south, west, north, east } = body.bbox;
  // Validate bbox geometry and approximate area
  if (north <= south || east <= west) {
    return reply.code(400).send({ error: 'invalid_bbox', message: 'Invalid bounds' });
  }
  const meanLat = (south + north) / 2;
  const heightKm = Math.abs(north - south) * 111.32;
  const widthKm = Math.abs(east - west) * 111.32 * Math.cos(meanLat * Math.PI / 180);
  const areaKm2 = heightKm * widthKm;
  if (!Number.isFinite(areaKm2) || areaKm2 <= 0) {
    return reply.code(400).send({ error: 'invalid_bbox', message: 'Unreasonable bounds' });
  }
  if (areaKm2 > 25) {
    return reply.code(400).send({ error: 'bbox_too_large', message: 'Please zoom in further (area > 25 km^2)' });
  }

  function bboxKey() {
    const r = (n: number) => n.toFixed(5);
    return `cache:asphalt:${r(south)},${r(west)},${r(north)},${r(east)}:p${body.includeParking ? 1 : 0}`;
  }

  const cacheKey = bboxKey();
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return reply.send(JSON.parse(cached));
    }
  } catch {}

  // Build Overpass QL query
  const qParts: string[] = [
    '[out:json][timeout:25];',
    '(',
    `way["surface"~"^(asphalt|paved)$"]["area"="yes"](${south},${west},${north},${east});`,
  ];
  if (body.includeParking) {
    qParts.push(
      `way["amenity"="parking"](${south},${west},${north},${east});`,
      `relation["amenity"="parking"](${south},${west},${north},${east});`
    );
  }
  qParts.push(
    `way["landuse"~"^(retail|industrial|commercial)$"]["surface"~"^(asphalt|paved)$"](${south},${west},${north},${east});`,
    `relation["landuse"~"^(retail|industrial|commercial)$"]["surface"~"^(asphalt|paved)$"](${south},${west},${north},${east});`,
    ');',
    'out body geom;'
  );
  const overpassQuery = qParts.join('\n');

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), body.timeoutMs);
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', 'User-Agent': 'OverWatch/1.0 (asphalt-detect)' },
      body: overpassQuery,
      signal: controller.signal
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      return reply.code(res.status).send({ error: 'overpass_failed', status: res.status, message: text?.slice(0, 400) });
    }
    const data = await res.json();
    const elements: any[] = Array.isArray(data?.elements) ? data.elements : [];
    // Normalize to an array of polygon rings (each ring: array of { lat, lon })
    const polygons: Array<Array<{ lat: number; lon: number }>> = [];
    for (const el of elements) {
      if (el.type === 'way' && Array.isArray(el.geometry) && el.geometry.length >= 3) {
        polygons.push(el.geometry.map((g: any) => ({ lat: Number(g.lat), lon: Number(g.lon) })));
      } else if (el.type === 'relation' && Array.isArray(el.members)) {
        for (const m of el.members) {
          if (m.role === 'outer' && Array.isArray(m.geometry) && m.geometry.length >= 3) {
            polygons.push(m.geometry.map((g: any) => ({ lat: Number(g.lat), lon: Number(g.lon) })));
          }
        }
      }
    }
    const payload = { polygons, count: polygons.length, bbox: body.bbox };
    try {
      await redis.set(cacheKey, JSON.stringify(payload), 'EX', 3600);
    } catch {}
    return reply.send(payload);
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return reply.code(504).send({ error: 'timeout', message: 'Upstream timeout' });
    }
    request.log.error({ err }, 'Overpass request failed');
    return reply.code(500).send({ error: 'internal_error', message: 'Detection failed' });
  } finally {
    clearTimeout(t);
  }
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

