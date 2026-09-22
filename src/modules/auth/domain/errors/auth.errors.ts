export class InvalidCredentialsError extends Error {
  override readonly name = 'InvalidCredentialsError';
}

export class InvalidRefreshTokenError extends Error {
  override readonly name = 'InvalidRefreshTokenError';
}

export class AuthenticationRequiredError extends Error {
  override readonly name = 'AuthenticationRequiredError';
}
