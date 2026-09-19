import Redis from "ioredis";
import { env } from "./env";

/**
 * DragonflyDB Client
 * Dedicated in-memory store for cache management, ticket concurrency locks,
 * sliding-window rate limiting, and pub/sub messaging.
 * Uses Dragonfly's high-throughput multi-threaded RESP engine on port 6379.
 */
export const dragonfly = new Redis(env.DRAGONFLY_URL, {
	maxRetriesPerRequest: 3,
	lazyConnect: true,
});

// Primary cache and backwards-compatible aliases
export const cache = dragonfly;
export const redis = dragonfly;
