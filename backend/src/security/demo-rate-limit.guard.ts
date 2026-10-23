import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { isIP } from 'node:net';

interface WindowCounter {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000;
const OVERALL_LIMIT = 120;
const WRITE_LIMIT = 15;

@Injectable()
export class DemoRateLimitGuard implements CanActivate {
  private readonly counters = new Map<string, WindowCounter>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const clientIp = this.getClientIp(request);
    const now = Date.now();
    this.removeExpiredCounters(now);

    this.checkBucket('overall', clientIp, OVERALL_LIMIT, now, response);
    if (['POST', 'PATCH', 'DELETE'].includes(request.method.toUpperCase())) {
      this.checkBucket('writes', clientIp, WRITE_LIMIT, now, response);
    }

    return true;
  }

  private getClientIp(request: Request): string {
    if (process.env.NODE_ENV !== 'production') {
      return request.ip || request.socket.remoteAddress || 'local';
    }

    const forwardedClientIp = request.headers['cf-connecting-ip'];
    if (
      typeof forwardedClientIp !== 'string' ||
      forwardedClientIp.includes(',') ||
      isIP(forwardedClientIp.trim()) === 0
    ) {
      throw new BadRequestException(
        'A valid client IP could not be determined.',
      );
    }

    return forwardedClientIp.trim();
  }

  private checkBucket(
    bucket: 'overall' | 'writes',
    clientIp: string,
    limit: number,
    now: number,
    response: Response,
  ): void {
    const key = `${bucket}:${clientIp}`;
    const current = this.counters.get(key);
    const counter =
      current && current.resetAt > now
        ? current
        : { count: 0, resetAt: now + WINDOW_MS };

    if (counter.count >= limit) {
      const retryAfter = Math.max(1, Math.ceil((counter.resetAt - now) / 1000));
      response.setHeader('Retry-After', retryAfter.toString());
      throw new HttpException(
        `The ${bucket} request limit has been reached. Try again in ${retryAfter} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    counter.count += 1;
    this.counters.set(key, counter);
  }

  private removeExpiredCounters(now: number): void {
    for (const [key, counter] of this.counters) {
      if (counter.resetAt <= now) this.counters.delete(key);
    }
  }
}
