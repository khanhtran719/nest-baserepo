import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { REPOSITORY_PROVIDER } from '../../shared/application/ports/repository-provider.port';
import { UNIT_OF_WORK } from '../../shared/application/unit-of-work/unit-of-work.constants';
import { TypeOrmRepositoryProvider } from './transaction/typeorm-repository-provider';
import { TypeOrmTransactionContext } from './transaction/typeorm-transaction-context';
import { TypeOrmUnitOfWork } from './transaction/typeorm-unit-of-work';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.getOrThrow<string>('database.host'),
        port: config.getOrThrow<number>('database.port'),
        username: config.getOrThrow<string>('database.username'),
        password: config.getOrThrow<string>('database.password'),
        database: config.getOrThrow<string>('database.database'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
  ],
  providers: [
    TypeOrmTransactionContext,
    TypeOrmUnitOfWork,
    TypeOrmRepositoryProvider,
    { provide: UNIT_OF_WORK, useExisting: TypeOrmUnitOfWork },
    { provide: REPOSITORY_PROVIDER, useExisting: TypeOrmRepositoryProvider },
  ],
  exports: [UNIT_OF_WORK, REPOSITORY_PROVIDER, TypeOrmTransactionContext],
})
export class DatabaseModule {}
