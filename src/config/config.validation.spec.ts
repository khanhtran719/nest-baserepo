import { validateEnvironment } from './config.validation';

describe('validateEnvironment', () => {
  it('accepts the health-only runtime without optional infrastructure configuration', () => {
    expect(validateEnvironment({ NODE_ENV: 'production', PORT: '3000' })).toEqual({
      NODE_ENV: 'production',
      PORT: '3000',
    });
  });

  it('rejects an invalid Redis port when Redis configuration is provided', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        PORT: '3000',
        REDIS_PORT: 'not-a-port',
      }),
    ).toThrow('REDIS_PORT');
  });

  it('rejects an empty Kafka broker list when Kafka configuration is provided', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        PORT: '3000',
        KAFKA_BROKERS: '',
      }),
    ).toThrow('KAFKA_BROKERS');
  });
});
