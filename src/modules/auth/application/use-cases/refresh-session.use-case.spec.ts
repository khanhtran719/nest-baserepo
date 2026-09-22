import { RefreshSessionUseCase } from './refresh-session.use-case';

describe('RefreshSessionUseCase', () => {
  it('rotates both tokens and persists only their digests', async () => {
    const accounts = {
      findByEmail: jest.fn(),
      findById: jest.fn().mockResolvedValue({
        id: 'account-1',
        email: 'admin@example.com',
        fullname: 'Admin',
        passwordHash: 'password-hash',
        active: true,
      }),
    };
    const sessions = {
      create: jest.fn(),
      findForUpdate: jest.fn().mockResolvedValue({
        id: 'session-1',
        userId: 'account-1',
        accessToken: 'old-access-digest',
        refreshToken: 'old-refresh-digest',
        expiresAt: new Date('2030-01-08T00:00:00.000Z'),
        logoutAt: null,
      }),
      updateTokens: jest.fn(),
      revoke: jest.fn(),
    };
    const tokens = {
      verifyRefreshToken: jest
        .fn()
        .mockResolvedValue({ accountId: 'account-1', sessionId: 'session-1' }),
      refreshTokenMatches: jest.fn().mockReturnValue(true),
      issuePair: jest.fn().mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        accessExpiresAt: new Date('2030-01-01T00:15:00.000Z'),
        refreshExpiresAt: new Date('2030-01-08T00:00:00.000Z'),
      }),
      digestToken: jest.fn((token: string) => `${token.split('-')[1]}-digest`),
      verifyAccessToken: jest.fn(),
    };
    const unitOfWork = { transaction: <T>(work: () => Promise<T>) => work() };
    const useCase = new RefreshSessionUseCase(accounts, sessions, tokens, unitOfWork);

    const result = await useCase.execute('old-refresh');

    expect(result.refreshToken).toBe('new-refresh');
    expect(sessions.updateTokens).toHaveBeenCalledWith(
      'session-1',
      'access-digest',
      'refresh-digest',
      new Date('2030-01-08T00:00:00.000Z'),
    );
  });

  it('revokes the session when an already-rotated refresh token is reused', async () => {
    const accounts = { findByEmail: jest.fn(), findById: jest.fn() };
    const sessions = {
      create: jest.fn(),
      findForUpdate: jest.fn().mockResolvedValue({
        id: 'session-1',
        userId: 'account-1',
        accessToken: 'current-access-digest',
        refreshToken: 'current-refresh-digest',
        expiresAt: new Date('2030-01-08T00:00:00.000Z'),
        logoutAt: null,
      }),
      updateTokens: jest.fn(),
      revoke: jest.fn(),
    };
    const tokens = {
      verifyRefreshToken: jest
        .fn()
        .mockResolvedValue({ accountId: 'account-1', sessionId: 'session-1' }),
      refreshTokenMatches: jest.fn().mockReturnValue(false),
      issuePair: jest.fn(),
      digestToken: jest.fn(),
      verifyAccessToken: jest.fn(),
    };
    const unitOfWork = { transaction: <T>(work: () => Promise<T>) => work() };
    const useCase = new RefreshSessionUseCase(accounts, sessions, tokens, unitOfWork);

    await expect(useCase.execute('reused-refresh')).rejects.toMatchObject({
      name: 'InvalidRefreshTokenError',
    });
    expect(sessions.revoke).toHaveBeenCalledWith('session-1');
  });
});
