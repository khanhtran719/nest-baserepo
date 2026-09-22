import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AUTH_TOKEN, AuthPrincipal, AuthTokenPort } from '../../application/ports/auth-token.port';

export interface AuthenticatedRequest extends Request {
  auth: AuthPrincipal;
}

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(@Inject(AUTH_TOKEN) private readonly tokens: AuthTokenPort) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.access_token as string | undefined;
    if (!token) throw new UnauthorizedException();
    try {
      request.auth = await this.tokens.verifyAccessToken(token);
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
