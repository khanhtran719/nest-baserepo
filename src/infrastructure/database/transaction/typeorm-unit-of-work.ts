import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UnitOfWork } from '../../../shared/application/unit-of-work/unit-of-work.port';
import { TypeOrmTransactionContext } from './typeorm-transaction-context';

@Injectable()
export class TypeOrmUnitOfWork implements UnitOfWork {
  constructor(
    private readonly dataSource: DataSource,
    private readonly transactionContext: TypeOrmTransactionContext,
  ) {}

  transaction<T>(work: () => Promise<T>): Promise<T> {
    const activeManager = this.transactionContext.getManager();
    if (activeManager) {
      return work();
    }

    return this.dataSource.transaction((manager) => this.transactionContext.run(manager, work));
  }
}
