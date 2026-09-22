import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, ObjectLiteral, Repository } from 'typeorm';
import { RepositoryProvider } from '../../../shared/application/ports/repository-provider.port';
import { TypeOrmTransactionContext } from './typeorm-transaction-context';

@Injectable()
export class TypeOrmRepositoryProvider implements RepositoryProvider {
  constructor(
    private readonly dataSource: DataSource,
    private readonly transactionContext: TypeOrmTransactionContext,
  ) {}

  get<T>(entity: new () => T): Repository<T & ObjectLiteral> {
    const manager: EntityManager | undefined = this.transactionContext.getManager();
    const ormEntity = entity as new () => T & ObjectLiteral;
    return manager ? manager.getRepository(ormEntity) : this.dataSource.getRepository(ormEntity);
  }
}
