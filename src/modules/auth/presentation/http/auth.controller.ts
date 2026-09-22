import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, CookieOptions } from 'express';
import { AuthenticationResult } from '../../application/auth-result';
import { GetProfileQuery } from '../../application/use-cases/get-profile.query';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RefreshSessionUseCase } from '../../application/use-cases/refresh-session.use-case';
import { AuthExceptionFilter } from './auth-exception.filter';
import { AuthenticatedRequest, AuthenticationGuard } from './authentication.guard';
import { LoginRequestDto } from './dto/login.request.dto';

@Controller('auth')
@UseFilters(AuthExceptionFilter)
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshSession: RefreshSessionUseCase,
    private readonly getProfile: GetProfileQuery,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginRequestDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.loginUseCase.execute(dto);
    this.setAuthCookies(response, result);
    return { account: result.account };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.refreshSession.execute(
      (request.cookies?.refresh_token as string | undefined) ?? '',
    );
    this.setAuthCookies(response, result);
    return { account: result.account };
  }

  @Get('profile')
  @UseGuards(AuthenticationGuard)
  profile(@Req() request: AuthenticatedRequest) {
    return this.getProfile.execute(request.auth.accountId);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.logoutUseCase.execute(request.cookies?.refresh_token as string | undefined);
    response.clearCookie('access_token', this.cookieOptions('/'));
    response.clearCookie('refresh_token', this.cookieOptions('/auth'));
  }

  private setAuthCookies(response: Response, result: AuthenticationResult): void {
    response.cookie('access_token', result.accessToken, {
      ...this.cookieOptions('/'),
      expires: result.accessExpiresAt,
    });
    response.cookie('refresh_token', result.refreshToken, {
      ...this.cookieOptions('/auth'),
      expires: result.refreshExpiresAt,
    });
  }

  private cookieOptions(path: string): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.getOrThrow<boolean>('auth.cookieSecure'),
      sameSite: 'lax',
      path,
    };
  }
}
