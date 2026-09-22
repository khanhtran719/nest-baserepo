import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AUTH_ACCOUNT_REPOSITORY } from './domain/repositories/auth-account.repository';
import { AUTH_SESSION_REPOSITORY } from './domain/repositories/auth-session.repository';
import { GetProfileQuery } from './application/use-cases/get-profile.query';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshSessionUseCase } from './application/use-cases/refresh-session.use-case';
import { AUTH_TOKEN } from './application/ports/auth-token.port';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { AuthAccountOrmEntity } from './infrastructure/persistence/typeorm/entities/auth-account.orm-entity';
import { AuthSessionOrmEntity } from './infrastructure/persistence/typeorm/entities/auth-session.orm-entity';
import { TypeOrmAuthAccountRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-auth-account.repository';
import { TypeOrmAuthSessionRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-auth-session.repository';
import { BcryptPasswordHasherAdapter } from './infrastructure/security/bcrypt-password-hasher.adapter';
import { JwtAuthTokenAdapter } from './infrastructure/security/jwt-auth-token.adapter';
import { AuthController } from './presentation/http/auth.controller';
import { AuthenticationGuard } from './presentation/http/authentication.guard';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([AuthAccountOrmEntity, AuthSessionOrmEntity])],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RefreshSessionUseCase,
    GetProfileQuery,
    LogoutUseCase,
    AuthenticationGuard,
    TypeOrmAuthAccountRepository,
    TypeOrmAuthSessionRepository,
    BcryptPasswordHasherAdapter,
    JwtAuthTokenAdapter,
    { provide: AUTH_ACCOUNT_REPOSITORY, useExisting: TypeOrmAuthAccountRepository },
    { provide: AUTH_SESSION_REPOSITORY, useExisting: TypeOrmAuthSessionRepository },
    { provide: PASSWORD_HASHER, useExisting: BcryptPasswordHasherAdapter },
    { provide: AUTH_TOKEN, useExisting: JwtAuthTokenAdapter },
  ],
})
export class AuthModule {}
