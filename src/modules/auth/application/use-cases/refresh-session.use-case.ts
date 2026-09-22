import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK } from '../../../../shared/application/unit-of-work/unit-of-work.constants';
import { UnitOfWork } from '../../../../shared/application/unit-of-work/unit-of-work.port';
import { InvalidRefreshTokenError } from '../../domain/errors/auth.errors';
import {
  AUTH_ACCOUNT_REPOSITORY,
  AuthAccountRepository,
} from '../../domain/repositories/auth-account.repository';
import {
  AUTH_SESSION_REPOSITORY,
  AuthSessionRepository,
} from '../../domain/repositories/auth-session.repository';
import { AuthenticationResult } from '../auth-result';
import { AUTH_TOKEN, AuthTokenPort } from '../ports/auth-token.port';

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    @Inject(AUTH_ACCOUNT_REPOSITORY) private readonly accounts: AuthAccountRepository,
    @Inject(AUTH_SESSION_REPOSITORY) private readonly sessions: AuthSessionRepository,
    @Inject(AUTH_TOKEN) private readonly tokens: AuthTokenPort,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(refreshToken: string): Promise<AuthenticationResult> {
    let claims: { accountId: string; sessionId: string };
    try {
      claims = await this.tokens.verifyRefreshToken(refreshToken);
    } catch {
      throw new InvalidRefreshTokenError();
    }
    const result = await this.unitOfWork.transaction(
      async (): Promise<AuthenticationResult | null> => {
        const session = await this.sessions.findForUpdate(claims.sessionId);
        if (
          !session ||
          session.logoutAt ||
          session.userId !== claims.accountId ||
          session.expiresAt <= new Date()
        ) {
          throw new InvalidRefreshTokenError();
        }
        if (!this.tokens.refreshTokenMatches(refreshToken, session.refreshToken)) {
          await this.sessions.revoke(session.id);
          return null;
        }
        const account = await this.accounts.findById(claims.accountId);
        if (!account || !account.active) throw new InvalidRefreshTokenError();
        const pair = await this.tokens.issuePair({
          accountId: account.id,
          email: account.email,
          sessionId: session.id,
        });
        await this.sessions.updateTokens(
          session.id,
          this.tokens.digestToken(pair.accessToken),
          this.tokens.digestToken(pair.refreshToken),
          pair.refreshExpiresAt,
        );
        return {
          ...pair,
          account: { id: account.id, email: account.email, fullname: account.fullname },
        };
      },
    );
    if (!result) throw new InvalidRefreshTokenError();
    return result;
  }
}
