import { AuthSession } from '../auth-session';

export const AUTH_SESSION_REPOSITORY = Symbol('AUTH_SESSION_REPOSITORY');

export interface CreateAuthSession {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  loginAt: Date;
  expiresAt: Date;
}

export interface AuthSessionRepository {
  create(session: CreateAuthSession): Promise<void>;
  findForUpdate(id: string): Promise<AuthSession | null>;
  updateTokens(
    id: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date,
  ): Promise<void>;
  revoke(id: string): Promise<void>;
}
