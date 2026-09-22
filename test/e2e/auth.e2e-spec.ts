import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { hash } from 'bcryptjs';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AuthAccountOrmEntity } from '../../src/modules/auth/infrastructure/persistence/typeorm/entities/auth-account.orm-entity';
import { AuthSessionOrmEntity } from '../../src/modules/auth/infrastructure/persistence/typeorm/entities/auth-session.orm-entity';

describe('Auth endpoints', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const email = 'auth-e2e@example.com';
  const password = 'correct-password-123';

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    dataSource = app.get(DataSource);
    await dataSource.getRepository(AuthAccountOrmEntity).upsert(
      {
        email,
        fullname: 'Auth E2E',
        passwordHash: await hash(password, 4),
        active: true,
        createdBy: null,
        modifiedBy: null,
        deletedBy: null,
        deletedAt: null,
        deleted: false,
      },
      ['email'],
    );
  });

  afterAll(async () => {
    const account = await dataSource.getRepository(AuthAccountOrmEntity).findOneBy({ email });
    if (account) {
      await dataSource.getRepository(AuthSessionOrmEntity).delete({ userId: account.id });
      await dataSource.getRepository(AuthAccountOrmEntity).delete(account.id);
    }
    await app.close();
  });

  it('logs in, reads profile, rotates refresh token, and logs out using cookies', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    const loginCookies = login.headers['set-cookie'] as unknown as string[];
    const accessCookie = loginCookies.find((cookie) => cookie.startsWith('access_token='));
    const refreshCookie = loginCookies.find((cookie) => cookie.startsWith('refresh_token='));
    expect(accessCookie).toContain('HttpOnly');
    expect(refreshCookie).toContain('HttpOnly');

    await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Cookie', accessCookie!)
      .expect(200)
      .expect(({ body }) => expect(body).toMatchObject({ email, fullname: 'Auth E2E' }));

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', refreshCookie!)
      .expect(200);
    const refreshedCookies = refreshed.headers['set-cookie'] as unknown as string[];
    const rotatedRefreshCookie = refreshedCookies.find((cookie) =>
      cookie.startsWith('refresh_token='),
    );
    expect(rotatedRefreshCookie).toBeDefined();
    expect(rotatedRefreshCookie).not.toBe(refreshCookie);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', refreshCookie!)
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', rotatedRefreshCookie!)
      .expect(204)
      .expect('set-cookie', /access_token=;/);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', rotatedRefreshCookie!)
      .expect(401);
  });

  it('returns the same safe error contract for invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401)
      .expect({ statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Authentication failed' });
  });
});
