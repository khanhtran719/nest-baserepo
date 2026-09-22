import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthTables1790052000000 implements MigrationInterface {
  name = 'CreateAuthTables1790052000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" varchar(320) NOT NULL,
        "fullname" varchar(120) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "created_by" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "modified_by" uuid,
        "modified_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_by" uuid,
        "deleted_at" timestamptz,
        "deleted" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "access_token" char(64) NOT NULL,
        "refresh_token" char(64) NOT NULL,
        "login_at" timestamptz NOT NULL,
        "logout_at" timestamptz,
        "expires_at" timestamptz NOT NULL,
        CONSTRAINT "PK_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sessions_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_sessions_user_id" ON "sessions" ("user_id")');
    await queryRunner.query('CREATE INDEX "IDX_sessions_expires_at" ON "sessions" ("expires_at")');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "sessions"');
    await queryRunner.query('DROP TABLE "users"');
  }
}
