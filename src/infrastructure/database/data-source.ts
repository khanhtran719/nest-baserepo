import 'reflect-metadata';
import { DataSource } from 'typeorm';
import databaseConfig from '../../config/database.config';
import { ExampleOrmEntity } from '../../modules/example/infrastructure/persistence/typeorm/entities/example.orm-entity';

const config = databaseConfig();

export default new DataSource({
  type: 'postgres',
  host: config.host,
  port: config.port,
  username: config.username,
  password: config.password,
  database: config.database,
  entities: [ExampleOrmEntity],
  migrations: ['dist/infrastructure/database/migrations/*.{js,ts}'],
});
