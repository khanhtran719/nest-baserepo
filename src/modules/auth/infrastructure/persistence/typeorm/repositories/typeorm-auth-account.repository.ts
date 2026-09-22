import { Injectable } from '@nestjs/common';
import { TypeOrmRepositoryProvider } from '../../../../../../infrastructure/database/transaction/typeorm-repository-provider';
import { AuthAccount } from '../../../../domain/auth-account';
import { AuthAccountRepository } from '../../../../domain/repositories/auth-account.repository';
import { AuthAccountOrmEntity } from '../entities/auth-account.orm-entity';

@Injectable()
export class TypeOrmAuthAccountRepository implements AuthAccountRepository {
  constructor(private readonly repositories: TypeOrmRepositoryProvider) {}
  findByEmail(email: string): Promise<AuthAccount | null> {
    return this.repositories
      .getRepository(AuthAccountOrmEntity)
      .findOneBy({ email, deleted: false });
  }
  findById(id: string): Promise<AuthAccount | null> {
    return this.repositories.getRepository(AuthAccountOrmEntity).findOneBy({ id, deleted: false });
  }
}
