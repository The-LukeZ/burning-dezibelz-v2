import { RateLimiterMemory, type RateLimiterRes } from "rate-limiter-flexible";

interface RateLimiterDecisionOptions {
  allowed: boolean;
  remainingPoints: number;
  msBeforeNext?: number;
  totalHits?: number;
  [key: string]: any; // Allow additional properties
}

interface RateLimiterDecision {
  /**
   * Indicates whether the request is allowed based on the rate limit.
   */
  allowed: boolean;
  /**
   * The number of points remaining after the request.
   */
  remainingPoints: number;
  /**
   * The number of milliseconds before the next request can be made.
   *
   * This is only provided if the request is not allowed.
   * If the request is allowed, this value may be undefined.
   */
  msBeforeNext?: number;
  /**
   * Total number of hits recorded in the current window.
   */
  totalHits?: number;
  isAllowed(): boolean;
  isDenied(): boolean;
  isRateLimited(): boolean;
}

interface RateLimiterOptions {
  /**
   * Maximum number of requests allowed within the duration.
   *
   * @default 100 (100 requests)
   */
  points: number;
  /**
   * Duration in seconds for which the rate limit applies.
   *
   * @default 300 (5 minutes)
   */
  duration: number;
  /**
   * Optional prefix for the keys used in the rate limiter.
   * This can help differentiate between different rate limiters or environments.
   */
  keyPrefix?: string;
}

class RateLimiter {
  private points: number;
  private duration: number;
  private keyPrefix: string;
  private store: RateLimiterMemory;

  constructor(
    options: RateLimiterOptions = {
      points: 100, // Default to 100 requests
      duration: 300, // Default to 5 minutes
    },
  ) {
    this.points = options.points;
    this.duration = options.duration;
    this.keyPrefix = options.keyPrefix || "";
    this.store = new RateLimiterMemory({
      points: this.points,
      duration: this.duration,
    });
  }

  /**
   * Protects a resource by consuming points from the rate limiter for a given key.
   *
   * @param key - The unique identifier for the rate limiting bucket
   * @param points - The number of points to consume (defaults to 1)
   * @param additionalData - Optional additional data to include in the decision
   * @returns A promise that resolves to a RateLimiterDecision containing:
   *   - `allowed`: boolean indicating if the request is permitted
   *   - `remainingPoints`: number of points left in the bucket
   *   - `msBeforeNext`: milliseconds until the next point is available
   *   - `totalHits`: total number of points consumed so far
   *
   * @example
   * ```ts
   * const decision = await rateLimiter.protect('user:123', 2);
   * if (!decision.allowed) {
   *   console.log(`Rate limited. Try again in ${decision.msBeforeNext}ms`);
   * }
   * ```
   */
  async protect(key: string, points: number = 1, additionalData: any = {}): Promise<RateLimiterDecision> {
    const fullKey = this.keyPrefix !== "" ? `${this.keyPrefix}:${key}` : key;

    try {
      const res = await this.store.consume(fullKey, points);
      return new RateLimiterDecision({
        allowed: true,
        remainingPoints: res.remainingPoints,
        msBeforeNext: res.msBeforeNext,
        totalHits: res.consumedPoints,
        ...additionalData,
      });
    } catch (rejRes: any) {
      const _reRes = rejRes as RateLimiterRes;
      return new RateLimiterDecision({
        allowed: false,
        remainingPoints: _reRes.remainingPoints,
        msBeforeNext: _reRes.msBeforeNext,
        totalHits: _reRes.consumedPoints,
        ...additionalData,
      });
    }
  }
}

class RateLimiterDecision implements RateLimiterDecision {
  allowed: boolean;
  remainingPoints: number;
  msBeforeNext?: number;
  totalHits?: number;
  private rest: any;

  constructor(data: RateLimiterDecisionOptions) {
    const { allowed, remainingPoints, msBeforeNext, totalHits, ...rest } = data;
    this.allowed = allowed;
    this.remainingPoints = remainingPoints;
    this.msBeforeNext = msBeforeNext;
    this.totalHits = totalHits;
    this.rest = { ...rest };
  }

  isAllowed(): this is { allowed: true } {
    return this.allowed;
  }

  isDenied(): this is { allowed: false } {
    return !this.allowed;
  }

  isRateLimited(): this is { allowed: false } {
    return this.msBeforeNext !== undefined;
  }

  get data(): Record<string, any> {
    return {
      allowed: this.allowed,
      remainingPoints: this.remainingPoints,
      msBeforeNext: this.msBeforeNext,
      totalHits: this.totalHits,
      ...this.rest,
    };
  }
}

export { RateLimiter, RateLimiterDecision, type RateLimiterOptions, type RateLimiterDecisionOptions };
