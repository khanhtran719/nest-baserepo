import { Example } from '../entities/example.entity';

export const EXAMPLE_REPOSITORY = Symbol('EXAMPLE_REPOSITORY');

export interface ExampleRepository {
  save(example: Example): Promise<void>;
}
