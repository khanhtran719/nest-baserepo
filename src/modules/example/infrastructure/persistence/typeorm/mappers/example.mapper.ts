import { Example } from '../../../../domain/entities/example.entity';
import { ExampleOrmEntity } from '../entities/example.orm-entity';

export class ExampleMapper {
  static toDomain(row: ExampleOrmEntity): Example {
    return Example.create(row.name, row.id, row.createdAt);
  }

  static toPersistence(example: Example): ExampleOrmEntity {
    const row = new ExampleOrmEntity();
    row.id = example.id;
    row.name = example.name;
    row.createdAt = example.createdAt;
    return row;
  }
}
