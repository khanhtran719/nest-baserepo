import { Injectable } from '@nestjs/common';
import { TypeOrmRepositoryProvider } from '../../../../../../infrastructure/database/transaction/typeorm-repository-provider';
import { AuthSession } from '../../../../domain/auth-session';
import {
  AuthSessionRepository,
  CreateAuthSession,
} from '../../../../domain/repositories/auth-session.repository';
import { AuthSessionOrmEntity } from '../entities/auth-session.orm-entity';

@Injectable()
export class TypeOrmAuthSessionRepository implements AuthSessionRepository {
  constructor(private readonly repositories: TypeOrmRepositoryProvider) {}
  async create(session: CreateAuthSession): Promise<void> {
    await this.repositories
      .getRepository(AuthSessionOrmEntity)
      .insert({ ...session, logoutAt: null });
  }
  findForUpdate(id: string): Promise<AuthSession | null> {
    return this.repositories
      .getRepository(AuthSessionOrmEntity)
      .createQueryBuilder('session')
      .setLock('pessimistic_write')
      .where('session.id = :id', { id })
      .getOne();
  }
  async updateTokens(
    id: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.repositories
      .getRepository(AuthSessionOrmEntity)
      .update(id, { accessToken, refreshToken, expiresAt });
  }
  async revoke(id: string): Promise<void> {
    await this.repositories
      .getRepository(AuthSessionOrmEntity)
      .update(id, { logoutAt: new Date() });
  }
}
