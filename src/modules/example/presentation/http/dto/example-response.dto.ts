import { Example } from '../../../domain/entities/example.entity';

export class ExampleResponseDto {
  id!: string;
  name!: string;
  createdAt!: string;

  static fromDomain(example: Example): ExampleResponseDto {
    const response = new ExampleResponseDto();
    response.id = example.id;
    response.name = example.name;
    response.createdAt = example.createdAt.toISOString();
    return response;
  }
}
