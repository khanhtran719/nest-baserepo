import { Test } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { HealthModule } from '../../src/health/health.module';

describe('Health endpoints', () => {
  it('reports liveness and readiness without optional dependencies', async () => {
    const module = await Test.createTestingModule({ imports: [HealthModule] }).compile();
    const app: INestApplication = module.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).get('/live').expect(200).expect({ status: 'ok' });
    await request(app.getHttpServer()).get('/ready').expect(200).expect({ status: 'ok' });
    await app.close();
  });
});
