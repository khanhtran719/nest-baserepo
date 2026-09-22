import { DomainEvent } from './domain-event';
import { Entity } from './entity';

export abstract class AggregateRoot<TId extends string = string> extends Entity<TId> {
  private readonly domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    return this.domainEvents.splice(0, this.domainEvents.length);
  }
}
