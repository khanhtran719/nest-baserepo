import { validateEnvironment } from './config.validation';

describe('validateEnvironment', () => {
  const requiredConfig = {
    NODE_ENV: 'production',
    PORT: '3000',
    ACCESS_KEY: 'access-key-with-at-least-thirty-two-characters',
    REFRESH_KEY: 'refresh-key-with-at-least-thirty-two-characters',
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    DB_USERNAME: 'postgres',
    DB_PASSWORD: 'postgres',
    DB_DATABASE: 'nest_base',
  };

  it('accepts a complete auth runtime configuration', () => {
    expect(validateEnvironment(requiredConfig)).toEqual(requiredConfig);
  });

  it('rejects an invalid Redis port when Redis configuration is provided', () => {
    expect(() =>
      validateEnvironment({
        ...requiredConfig,
        REDIS_PORT: 'not-a-port',
      }),
    ).toThrow('REDIS_PORT');
  });

  it('rejects an empty Kafka broker list when Kafka configuration is provided', () => {
    expect(() =>
      validateEnvironment({
        ...requiredConfig,
        KAFKA_BROKERS: '',
      }),
    ).toThrow('KAFKA_BROKERS');
  });

  it('requires separate access and refresh signing keys', () => {
    expect(() =>
      validateEnvironment({
        ...requiredConfig,
        REFRESH_KEY: undefined,
      }),
    ).toThrow('REFRESH_KEY');
  });
});
