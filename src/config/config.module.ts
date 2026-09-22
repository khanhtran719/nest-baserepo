import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './app.config';
import authConfig from './auth.config';
import databaseConfig from './database.config';
import kafkaConfig from './kafka.config';
import observabilityConfig from './observability.config';
import redisConfig from './redis.config';
import { validateEnvironment } from './config.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
      load: [appConfig, authConfig, databaseConfig, redisConfig, kafkaConfig, observabilityConfig],
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
