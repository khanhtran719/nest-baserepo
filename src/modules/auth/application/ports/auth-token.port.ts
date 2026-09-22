export interface AuthPrincipal {
  accountId: string;
  email: string;
  sessionId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
}

export const AUTH_TOKEN = Symbol('AUTH_TOKEN');

export interface AuthTokenPort {
  issuePair(principal: AuthPrincipal): Promise<TokenPair>;
  verifyAccessToken(token: string): Promise<AuthPrincipal>;
  verifyRefreshToken(token: string): Promise<Pick<AuthPrincipal, 'accountId' | 'sessionId'>>;
  digestToken(token: string): string;
  refreshTokenMatches(token: string, digest: string): boolean;
}
