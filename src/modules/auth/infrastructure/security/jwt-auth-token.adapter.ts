import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sign, verify } from 'jsonwebtoken';
import { AuthPrincipal, AuthTokenPort, TokenPair } from '../../application/ports/auth-token.port';

interface JwtClaims {
  sub: string;
  email?: string;
  sid: string;
  typ: 'access' | 'refresh';
}

@Injectable()
export class JwtAuthTokenAdapter implements AuthTokenPort {
  constructor(private readonly config: ConfigService) {}

  async issuePair(principal: AuthPrincipal): Promise<TokenPair> {
    const now = Date.now();
    const accessTtl = this.config.getOrThrow<number>('auth.accessTtlSeconds');
    const refreshTtl = this.config.getOrThrow<number>('auth.refreshTtlSeconds');
    const accessToken = sign(
      { sub: principal.accountId, email: principal.email, sid: principal.sessionId, typ: 'access' },
      this.config.getOrThrow<string>('auth.accessKey'),
      { expiresIn: accessTtl, jwtid: randomUUID() },
    );
    const refreshToken = sign(
      { sub: principal.accountId, sid: principal.sessionId, typ: 'refresh' },
      this.config.getOrThrow<string>('auth.refreshKey'),
      { expiresIn: refreshTtl, jwtid: randomUUID() },
    );
    return {
      accessToken,
      refreshToken,
      accessExpiresAt: new Date(now + accessTtl * 1000),
      refreshExpiresAt: new Date(now + refreshTtl * 1000),
    };
  }

  async verifyAccessToken(token: string): Promise<AuthPrincipal> {
    const claims = verify(token, this.config.getOrThrow<string>('auth.accessKey')) as JwtClaims;
    if (claims.typ !== 'access' || !claims.email) throw new Error('Invalid access token');
    return { accountId: claims.sub, email: claims.email, sessionId: claims.sid };
  }
  async verifyRefreshToken(token: string): Promise<Pick<AuthPrincipal, 'accountId' | 'sessionId'>> {
    const claims = verify(token, this.config.getOrThrow<string>('auth.refreshKey')) as JwtClaims;
    if (claims.typ !== 'refresh') throw new Error('Invalid refresh token');
    return { accountId: claims.sub, sessionId: claims.sid };
  }
  digestToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
  refreshTokenMatches(token: string, digest: string): boolean {
    const actual = Buffer.from(this.digestToken(token), 'hex');
    const expected = Buffer.from(digest, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}
