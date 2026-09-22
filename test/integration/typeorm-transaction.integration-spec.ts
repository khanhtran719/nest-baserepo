import { randomUUID } from 'node:crypto';
import { Column, DataSource, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TypeOrmRepositoryProvider } from '../../src/infrastructure/database/transaction/typeorm-repository-provider';
import { TypeOrmTransactionContext } from '../../src/infrastructure/database/transaction/typeorm-transaction-context';
import { TypeOrmUnitOfWork } from '../../src/infrastructure/database/transaction/typeorm-unit-of-work';

@Entity({ name: 'transaction_records' })
class TransactionRecordOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  value!: string;
}

describe('TypeORM transaction foundation', () => {
  const schema = `foundation_test_${randomUUID().replaceAll('-', '_')}`;
  const database = process.env.DB_DATABASE ?? 'nest_base';
  const connection = {
    type: 'postgres' as const,
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database,
  };
  const admin = new DataSource(connection);
  const dataSource = new DataSource({
    ...connection,
    schema,
    entities: [TransactionRecordOrmEntity],
    synchronize: true,
  });

  beforeAll(async () => {
    await admin.initialize();
    await admin.query(`CREATE SCHEMA "${schema}"`);
    await dataSource.initialize();
  });

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    if (admin.isInitialized) {
      await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await admin.destroy();
    }
  });

  it('rolls back repository writes resolved through the active transaction manager', async () => {
    const context = new TypeOrmTransactionContext();
    const unitOfWork = new TypeOrmUnitOfWork(dataSource, context);
    const repositories = new TypeOrmRepositoryProvider(dataSource, context);

    await expect(
      unitOfWork.transaction(async () => {
        const record = new TransactionRecordOrmEntity();
        record.value = 'must roll back';
        await repositories.getRepository(TransactionRecordOrmEntity).save(record);
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');

    await expect(repositories.getRepository(TransactionRecordOrmEntity).count()).resolves.toBe(0);
  });
});
