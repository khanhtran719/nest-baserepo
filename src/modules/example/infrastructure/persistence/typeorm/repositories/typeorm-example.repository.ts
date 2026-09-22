import { Inject, Injectable } from '@nestjs/common';
import {
  REPOSITORY_PROVIDER,
  RepositoryProvider,
} from '../../../../../../shared/application/ports/repository-provider.port';
import { Example } from '../../../../domain/entities/example.entity';
import { ExampleRepository } from '../../../../domain/repositories/example.repository';
import { ExampleOrmEntity } from '../entities/example.orm-entity';
import { ExampleMapper } from '../mappers/example.mapper';

@Injectable()
export class TypeOrmExampleRepository implements ExampleRepository {
  constructor(@Inject(REPOSITORY_PROVIDER) private readonly repositories: RepositoryProvider) {}

  async save(example: Example): Promise<void> {
    await this.repositories.get(ExampleOrmEntity).save(ExampleMapper.toPersistence(example));
  }
}
