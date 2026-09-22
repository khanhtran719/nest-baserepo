import { randomUUID } from 'node:crypto';
import { Entity } from '../../../../shared/domain/entity';
import { ExampleNameRequiredError, ExampleNameTooLongError } from '../errors/example.errors';

export class Example extends Entity {
  private constructor(
    id: string,
    public readonly name: string,
    public readonly createdAt: Date,
  ) {
    super(id);
  }

  static create(name: string, id: string = randomUUID(), createdAt = new Date()): Example {
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new ExampleNameRequiredError();
    }
    if (normalizedName.length > 120) {
      throw new ExampleNameTooLongError();
    }
    return new Example(id, normalizedName, createdAt);
  }
}
