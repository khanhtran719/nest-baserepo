import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'sessions' })
export class AuthSessionOrmEntity {
  @PrimaryColumn({ type: 'uuid' }) id!: string;
  @Index() @Column({ name: 'user_id', type: 'uuid' }) userId!: string;
  @Column({ name: 'access_token', type: 'char', length: 64 }) accessToken!: string;
  @Column({ name: 'refresh_token', type: 'char', length: 64 }) refreshToken!: string;
  @Column({ name: 'login_at', type: 'timestamptz' }) loginAt!: Date;
  @Column({ name: 'logout_at', type: 'timestamptz', nullable: true }) logoutAt!: Date | null;
  @Column({ name: 'expires_at', type: 'timestamptz' }) expiresAt!: Date;
}
