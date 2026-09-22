import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { AppLoggingModule } from './infrastructure/observability/logging/logging.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [AppConfigModule, AppLoggingModule, HealthModule],
})
export class AppModule {}
