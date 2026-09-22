import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK } from '../../../../shared/application/unit-of-work/unit-of-work.constants';
import { UnitOfWork } from '../../../../shared/application/unit-of-work/unit-of-work.port';
import { Example } from '../../domain/entities/example.entity';
import {
  EXAMPLE_REPOSITORY,
  ExampleRepository,
} from '../../domain/repositories/example.repository';

@Injectable()
export class CreateExampleService {
  constructor(
    @Inject(EXAMPLE_REPOSITORY) private readonly repository: ExampleRepository,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: { name: string }): Promise<Example> {
    const example = Example.create(input.name);
    return this.unitOfWork.transaction(async () => {
      await this.repository.save(example);
      return example;
    });
  }
}
