import { registerAs } from '@nestjs/config';

export default registerAs('observability', () => ({
  serviceName: process.env.OBSERVABILITY_SERVICE_NAME ?? 'nest-baserepo',
}));
