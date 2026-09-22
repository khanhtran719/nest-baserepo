import { registerAs } from '@nestjs/config';

export default registerAs('kafka', () => ({
  brokers: process.env.KAFKA_BROKERS
    ? process.env.KAFKA_BROKERS.split(',')
        .map((broker) => broker.trim())
        .filter(Boolean)
    : undefined,
}));
