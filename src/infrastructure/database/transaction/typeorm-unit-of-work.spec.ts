import { DataSource, EntityManager } from 'typeorm';
import { TypeOrmTransactionContext } from './typeorm-transaction-context';
import { TypeOrmUnitOfWork } from './typeorm-unit-of-work';

describe('TypeOrmUnitOfWork', () => {
  it('starts and commits a transaction', async () => {
    const context = new TypeOrmTransactionContext();
    const manager = {} as EntityManager;
    const dataSource = {
      transaction: jest.fn(async (work: (activeManager: EntityManager) => Promise<unknown>) =>
        work(manager),
      ),
    } as unknown as DataSource;
    const unitOfWork = new TypeOrmUnitOfWork(dataSource, context);

    const result = await unitOfWork.transaction(async () => 'done');

    expect(result).toBe('done');
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('joins an existing transaction instead of creating a nested one', async () => {
    const context = new TypeOrmTransactionContext();
    const manager = {} as EntityManager;
    const dataSource = { transaction: jest.fn() } as unknown as DataSource;
    const unitOfWork = new TypeOrmUnitOfWork(dataSource, context);

    const result = await context.run(manager, () => unitOfWork.transaction(async () => 'joined'));

    expect(result).toBe('joined');
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});
