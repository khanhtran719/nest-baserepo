import { Example } from '../../domain/entities/example.entity';
import { ExampleRepository } from '../../domain/repositories/example.repository';
import { CreateExampleService } from './create-example.service';
import { UnitOfWork } from '../../../../shared/application/unit-of-work/unit-of-work.port';

describe('CreateExampleService', () => {
  it('creates and persists an example inside a unit-of-work transaction', async () => {
    const saved: Example[] = [];
    const repository: ExampleRepository = {
      save: jest.fn(async (example) => void saved.push(example)),
    };
    const unitOfWork: UnitOfWork = {
      transaction: jest.fn(async (work) => work()),
    };
    const service = new CreateExampleService(repository, unitOfWork);

    const result = await service.execute({ name: '  reference  ' });

    expect(result.name).toBe('reference');
    expect(saved).toHaveLength(1);
    expect(unitOfWork.transaction).toHaveBeenCalledTimes(1);
  });

  it('rejects an empty name before persistence', async () => {
    const repository: ExampleRepository = { save: jest.fn() };
    const unitOfWork: UnitOfWork = { transaction: jest.fn() };
    const service = new CreateExampleService(repository, unitOfWork);

    await expect(service.execute({ name: '   ' })).rejects.toThrow('Example name is required');
    expect(repository.save).not.toHaveBeenCalled();
    expect(unitOfWork.transaction).not.toHaveBeenCalled();
  });
});
