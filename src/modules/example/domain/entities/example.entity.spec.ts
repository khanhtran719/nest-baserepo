import { Example } from './example.entity';

describe('Example', () => {
  it('trims a valid name and creates an identity', () => {
    const example = Example.create('  reference  ');

    expect(example.id).toEqual(expect.any(String));
    expect(example.name).toBe('reference');
    expect(example.createdAt).toEqual(expect.any(Date));
  });

  it('rejects names longer than the domain limit', () => {
    expect(() => Example.create('x'.repeat(121))).toThrow(
      'Example name must be 120 characters or fewer',
    );
  });
});
