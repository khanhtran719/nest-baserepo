import { EventEnvelope } from '../events/event-envelope';

export const OUTBOX = Symbol('OUTBOX');

export interface OutboxPort {
  add<TPayload extends object>(event: EventEnvelope<TPayload>): Promise<void>;
}
