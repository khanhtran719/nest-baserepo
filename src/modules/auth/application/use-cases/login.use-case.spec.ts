import { LoginUseCase } from './login.use-case';

describe('LoginUseCase', () => {
  it('creates a refresh session and returns a token pair for valid credentials', async () => {
    const accounts = {
      findByEmail: jest.fn().mockResolvedValue({
        id: 'account-1',
        email: 'admin@example.com',
        fullname: 'Admin',
        passwordHash: 'password-hash',
        active: true,
      }),
      findById: jest.fn(),
    };
    const sessions = {
      create: jest.fn(),
      findForUpdate: jest.fn(),
      updateTokens: jest.fn(),
      revoke: jest.fn(),
    };
    const passwords = { verify: jest.fn().mockResolvedValue(true), hash: jest.fn() };
    const tokens = {
      issuePair: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        accessExpiresAt: new Date('2030-01-01T00:15:00.000Z'),
        refreshExpiresAt: new Date('2030-01-08T00:00:00.000Z'),
      }),
      digestToken: jest.fn((token: string) => `${token.split('-')[0]}-digest`),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
      refreshTokenMatches: jest.fn(),
    };
    const unitOfWork = { transaction: <T>(work: () => Promise<T>) => work() };
    const useCase = new LoginUseCase(accounts, sessions, passwords, tokens, unitOfWork);

    const result = await useCase.execute({
      email: 'ADMIN@example.com',
      password: 'correct-password',
    });

    expect(result.accessToken).toBe('access-token');
    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'account-1',
        accessToken: 'access-digest',
        refreshToken: 'refresh-digest',
      }),
    );
  });

  it('rejects invalid credentials without revealing whether the account exists', async () => {
    const accounts = { findByEmail: jest.fn().mockResolvedValue(null), findById: jest.fn() };
    const sessions = {
      create: jest.fn(),
      findForUpdate: jest.fn(),
      updateTokens: jest.fn(),
      revoke: jest.fn(),
    };
    const passwords = { verify: jest.fn(), hash: jest.fn() };
    const tokens = {
      issuePair: jest.fn(),
      digestToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
      refreshTokenMatches: jest.fn(),
    };
    const unitOfWork = { transaction: <T>(work: () => Promise<T>) => work() };
    const useCase = new LoginUseCase(accounts, sessions, passwords, tokens, unitOfWork);

    await expect(
      useCase.execute({ email: 'missing@example.com', password: 'password' }),
    ).rejects.toMatchObject({ name: 'InvalidCredentialsError' });
  });
});
