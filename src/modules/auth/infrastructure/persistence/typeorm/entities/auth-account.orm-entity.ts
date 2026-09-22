import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class AuthAccountOrmEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index({ unique: true }) @Column({ type: 'varchar', length: 320 }) email!: string;
  @Column({ type: 'varchar', length: 120 }) fullname!: string;
  @Column({ name: 'password_hash', type: 'varchar', length: 255 }) passwordHash!: string;
  @Column({ type: 'boolean', default: true }) active!: boolean;
  @Column({ name: 'created_by', type: 'uuid', nullable: true }) createdBy!: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @Column({ name: 'modified_by', type: 'uuid', nullable: true }) modifiedBy!: string | null;
  @UpdateDateColumn({ name: 'modified_at', type: 'timestamptz' }) modifiedAt!: Date;
  @Column({ name: 'deleted_by', type: 'uuid', nullable: true }) deletedBy!: string | null;
  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true }) deletedAt!: Date | null;
  @Column({ type: 'boolean', default: false }) deleted!: boolean;
}
