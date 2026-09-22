import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AppLoggingModule } from './infrastructure/observability/logging/logging.module';
import { ExampleModule } from './modules/example/example.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [AppConfigModule, AppLoggingModule, DatabaseModule, HealthModule, ExampleModule],
})
export class AppModule {}
