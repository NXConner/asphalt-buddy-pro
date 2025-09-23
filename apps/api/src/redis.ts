import Redis from 'ioredis';
import { loadEnv } from './env.js';

const env = loadEnv();
export const redis = new Redis(env.REDIS_URL);

