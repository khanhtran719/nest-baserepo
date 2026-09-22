import { DataSource, EntityManager, ObjectLiteral, Repository } from 'typeorm';
import { TypeOrmRepositoryProvider } from './typeorm-repository-provider';
import { TypeOrmTransactionContext } from './typeorm-transaction-context';

class TestOrmEntity {
  id!: string;
}

describe('TypeOrmRepositoryProvider', () => {
  it('uses the data source repository outside a transaction', () => {
    const repository = {} as Repository<TestOrmEntity & ObjectLiteral>;
    const dataSource = {
      getRepository: jest.fn().mockReturnValue(repository),
    } as unknown as DataSource;
    const provider = new TypeOrmRepositoryProvider(dataSource, new TypeOrmTransactionContext());

    expect(provider.getRepository(TestOrmEntity)).toBe(repository);
  });

  it('uses the active manager repository inside a transaction', async () => {
    const repository = {} as Repository<TestOrmEntity & ObjectLiteral>;
    const manager = {
      getRepository: jest.fn().mockReturnValue(repository),
    } as unknown as EntityManager;
    const dataSource = {
      getRepository: jest.fn(),
    } as unknown as DataSource;
    const context = new TypeOrmTransactionContext();
    const provider = new TypeOrmRepositoryProvider(dataSource, context);

    await context.run(manager, async () => {
      expect(provider.getRepository(TestOrmEntity)).toBe(repository);
    });

    expect(dataSource.getRepository).not.toHaveBeenCalled();
  });
});
