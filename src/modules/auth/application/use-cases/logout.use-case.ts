import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK } from '../../../../shared/application/unit-of-work/unit-of-work.constants';
import { UnitOfWork } from '../../../../shared/application/unit-of-work/unit-of-work.port';
import {
  AUTH_SESSION_REPOSITORY,
  AuthSessionRepository,
} from '../../domain/repositories/auth-session.repository';
import { AUTH_TOKEN, AuthTokenPort } from '../ports/auth-token.port';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY) private readonly sessions: AuthSessionRepository,
    @Inject(AUTH_TOKEN) private readonly tokens: AuthTokenPort,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    let sessionId: string;
    try {
      const claims = await this.tokens.verifyRefreshToken(refreshToken);
      sessionId = claims.sessionId;
    } catch {
      // Logout is intentionally idempotent; cookies are cleared even for an expired token.
      return;
    }
    await this.unitOfWork.transaction(() => this.sessions.revoke(sessionId));
  }
}
