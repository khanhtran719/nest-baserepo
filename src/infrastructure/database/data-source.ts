import 'reflect-metadata';
import { DataSource } from 'typeorm';
import databaseConfig from '../../config/database.config';

const config = databaseConfig();

export default new DataSource({
  type: 'postgres',
  host: config.host,
  port: config.port,
  username: config.username,
  password: config.password,
  database: config.database,
  entities: ['dist/modules/**/infrastructure/persistence/typeorm/entities/*.{js,ts}'],
  migrations: ['dist/infrastructure/database/migrations/*.{js,ts}'],
});
