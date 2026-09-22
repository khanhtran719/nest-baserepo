import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK } from '../../../../shared/application/unit-of-work/unit-of-work.constants';
import { UnitOfWork } from '../../../../shared/application/unit-of-work/unit-of-work.port';
import { InvalidCredentialsError } from '../../domain/errors/auth.errors';
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
import { PASSWORD_HASHER, PasswordHasher } from '../ports/password-hasher.port';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_ACCOUNT_REPOSITORY) private readonly accounts: AuthAccountRepository,
    @Inject(AUTH_SESSION_REPOSITORY) private readonly sessions: AuthSessionRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher,
    @Inject(AUTH_TOKEN) private readonly tokens: AuthTokenPort,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: { email: string; password: string }): Promise<AuthenticationResult> {
    const account = await this.accounts.findByEmail(input.email.trim().toLowerCase());
    if (
      !account ||
      !account.active ||
      !(await this.passwords.verify(input.password, account.passwordHash))
    ) {
      throw new InvalidCredentialsError();
    }
    return this.unitOfWork.transaction(async () => {
      const sessionId = randomUUID();
      const pair = await this.tokens.issuePair({
        accountId: account.id,
        email: account.email,
        sessionId,
      });
      await this.sessions.create({
        id: sessionId,
        userId: account.id,
        accessToken: this.tokens.digestToken(pair.accessToken),
        refreshToken: this.tokens.digestToken(pair.refreshToken),
        loginAt: new Date(),
        expiresAt: pair.refreshExpiresAt,
      });
      return {
        ...pair,
        account: { id: account.id, email: account.email, fullname: account.fullname },
      };
    });
  }
}
