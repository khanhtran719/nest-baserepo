import { Test } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Health endpoints', () => {
  it('boots with only health capabilities and reports liveness/readiness', async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app: INestApplication = module.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).get('/live').expect(200).expect({ status: 'ok' });
    await request(app.getHttpServer()).get('/ready').expect(200).expect({ status: 'ok' });
    await request(app.getHttpServer()).get('/examples').expect(404);
    await app.close();
  });
});
