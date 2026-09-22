export interface EventEnvelope<TPayload extends object> {
  eventId: string;
  eventType: string;
  aggregateId: string;
  occurredAt: string;
  source: string;
  version: number;
  payload: TPayload;
  correlationId?: string;
  causationId?: string;
}
