import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateExamples1710000000000 implements MigrationInterface {
  name = 'CreateExamples1710000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'examples',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'name', type: 'varchar', length: '120' },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('examples');
  }
}
