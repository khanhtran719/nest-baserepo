import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

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
  @Type(() => Number)
  PORT = 3000;

  @IsString()
  @IsOptional()
  DB_HOST?: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  @Type(() => Number)
  DB_PORT?: number;

  @IsString()
  @IsOptional()
  DB_USERNAME?: string;

  @IsString()
  @IsOptional()
  DB_PASSWORD?: string;

  @IsString()
  @IsOptional()
  DB_DATABASE?: string;

  @IsString()
  @IsOptional()
  REDIS_HOST?: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  @Type(() => Number)
  REDIS_PORT?: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  KAFKA_BROKERS?: string;

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
        .map((error) =>
          Object.values(error.constraints ?? {}).map(
            (constraint) => `${error.property}: ${constraint}`,
          ),
        )
        .flat()
        .join('; '),
    );
  }
  return config;
}
