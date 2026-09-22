import { TokenPair } from './ports/auth-token.port';

export interface AuthenticatedAccount {
  id: string;
  email: string;
  fullname: string;
}

export interface AuthenticationResult extends TokenPair {
  account: AuthenticatedAccount;
}
