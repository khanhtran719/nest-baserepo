import { EntityManager } from 'typeorm';
import { TypeOrmTransactionContext } from './typeorm-transaction-context';

describe('TypeOrmTransactionContext', () => {
  it('exposes the manager only inside the async transaction scope', async () => {
    const context = new TypeOrmTransactionContext();
    const manager = {} as EntityManager;

    expect(context.isInTransaction()).toBe(false);
    expect(context.getManager()).toBeUndefined();

    await context.run(manager, async () => {
      expect(context.isInTransaction()).toBe(true);
      expect(context.getManager()).toBe(manager);
    });

    expect(context.isInTransaction()).toBe(false);
  });
});
