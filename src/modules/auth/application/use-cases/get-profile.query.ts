import { Inject, Injectable } from '@nestjs/common';
import { AuthenticationRequiredError } from '../../domain/errors/auth.errors';
import {
  AUTH_ACCOUNT_REPOSITORY,
  AuthAccountRepository,
} from '../../domain/repositories/auth-account.repository';
import { AuthenticatedAccount } from '../auth-result';

@Injectable()
export class GetProfileQuery {
  constructor(@Inject(AUTH_ACCOUNT_REPOSITORY) private readonly accounts: AuthAccountRepository) {}

  async execute(accountId: string): Promise<AuthenticatedAccount> {
    const account = await this.accounts.findById(accountId);
    if (!account || !account.active) throw new AuthenticationRequiredError();
    return { id: account.id, email: account.email, fullname: account.fullname };
  }
}
