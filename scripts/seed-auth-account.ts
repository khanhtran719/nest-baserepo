import 'reflect-metadata';
import 'dotenv/config';
import { hash } from 'bcryptjs';
import dataSource from '../src/infrastructure/database/data-source';
import { AuthAccountOrmEntity } from '../src/modules/auth/infrastructure/persistence/typeorm/entities/auth-account.orm-entity';

async function seed(): Promise<void> {
  const email = process.env.AUTH_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.AUTH_SEED_PASSWORD;
  const fullname = process.env.AUTH_SEED_FULLNAME?.trim() || 'Administrator';
  if (!email || !password || password.length < 12) {
    throw new Error('AUTH_SEED_EMAIL and AUTH_SEED_PASSWORD (minimum 12 characters) are required');
  }
  await dataSource.initialize();
  try {
    const repository = dataSource.getRepository(AuthAccountOrmEntity);
    const passwordHash = await hash(password, 12);
    await repository.upsert(
      {
        email,
        fullname,
        passwordHash,
        active: true,
        createdBy: null,
        modifiedBy: null,
        deletedBy: null,
        deletedAt: null,
        deleted: false,
      },
      ['email'],
    );
  } finally {
    await dataSource.destroy();
  }
}

void seed();
