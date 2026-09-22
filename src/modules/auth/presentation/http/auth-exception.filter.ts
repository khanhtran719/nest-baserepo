import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import {
  AuthenticationRequiredError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from '../../domain/errors/auth.errors';

@Catch(InvalidCredentialsError, InvalidRefreshTokenError, AuthenticationRequiredError)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const code =
      exception instanceof InvalidCredentialsError
        ? 'INVALID_CREDENTIALS'
        : 'AUTHENTICATION_REQUIRED';
    response
      .status(HttpStatus.UNAUTHORIZED)
      .json({ statusCode: 401, code, message: 'Authentication failed' });
  }
}
