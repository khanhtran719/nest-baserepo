export interface AuthSession {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  loginAt: Date;
  logoutAt: Date | null;
  expiresAt: Date;
}
