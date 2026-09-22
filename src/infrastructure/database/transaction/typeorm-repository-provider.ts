import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { TypeOrmTransactionContext } from './typeorm-transaction-context';

@Injectable()
export class TypeOrmRepositoryProvider {
  constructor(
    private readonly dataSource: DataSource,
    private readonly transactionContext: TypeOrmTransactionContext,
  ) {}

  getRepository<T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T> {
    const manager: EntityManager | undefined = this.transactionContext.getManager();
    return manager ? manager.getRepository(entity) : this.dataSource.getRepository(entity);
  }
}
