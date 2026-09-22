import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  accessKey: process.env.ACCESS_KEY,
  refreshKey: process.env.REFRESH_KEY,
  accessTtlSeconds: Number(process.env.ACCESS_TTL_SECONDS ?? 900),
  refreshTtlSeconds: Number(process.env.REFRESH_TTL_SECONDS ?? 604800),
  cookieSecure: process.env.NODE_ENV === 'production',
}));
