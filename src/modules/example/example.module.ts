import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { EXAMPLE_REPOSITORY } from './domain/repositories/example.repository';
import { CreateExampleService } from './application/services/create-example.service';
import { TypeOrmExampleRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-example.repository';
import { ExampleOrmEntity } from './infrastructure/persistence/typeorm/entities/example.orm-entity';
import { ExampleController } from './presentation/http/example.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([ExampleOrmEntity])],
  controllers: [ExampleController],
  providers: [
    CreateExampleService,
    TypeOrmExampleRepository,
    { provide: EXAMPLE_REPOSITORY, useExisting: TypeOrmExampleRepository },
  ],
})
export class ExampleModule {}
