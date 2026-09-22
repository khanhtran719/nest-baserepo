import { DomainEvent } from '../../shared/domain/domain-event';

export const OUTBOX = Symbol('OUTBOX');

export interface OutboxPort {
  add(event: DomainEvent): Promise<void>;
}
