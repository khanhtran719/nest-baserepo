import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3000;

  @IsString()
  DB_HOST = 'localhost';

  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT = 5432;

  @IsString()
  DB_USERNAME = 'postgres';

  @IsString()
  DB_PASSWORD = 'postgres';

  @IsString()
  DB_DATABASE = 'nest_base';

  @IsOptional()
  @IsString()
  OBSERVABILITY_SERVICE_NAME?: string;
}

export function validateEnvironment(config: Record<string, unknown>): Record<string, unknown> {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(
      errors
        .map((error) => Object.values(error.constraints ?? {}))
        .flat()
        .join('; '),
    );
  }
  return config;
}
