import 'reflect-metadata';
import 'dotenv/config';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import databaseConfig from '../../config/database.config';

const config = databaseConfig();

function requireDatabaseValue<T>(value: T | undefined, name: string): T {
  if (value === undefined || value === '') {
    throw new Error(`${name} is required for database operations`);
  }

  return value;
}

export default new DataSource({
  type: 'postgres',
  host: requireDatabaseValue(config.host, 'DB_HOST'),
  port: requireDatabaseValue(config.port, 'DB_PORT'),
  username: requireDatabaseValue(config.username, 'DB_USERNAME'),
  password: requireDatabaseValue(config.password, 'DB_PASSWORD'),
  database: requireDatabaseValue(config.database, 'DB_DATABASE'),
  entities: [
    join(__dirname, '../../modules/**/*.orm-entity.{ts,js}'),
    join(__dirname, '../outbox/**/*.orm-entity.{ts,js}'),
  ],
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
  synchronize: false,
});
