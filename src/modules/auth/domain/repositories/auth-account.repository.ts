import { AuthAccount } from '../auth-account';

export const AUTH_ACCOUNT_REPOSITORY = Symbol('AUTH_ACCOUNT_REPOSITORY');

export interface AuthAccountRepository {
  findByEmail(email: string): Promise<AuthAccount | null>;
  findById(id: string): Promise<AuthAccount | null>;
}
