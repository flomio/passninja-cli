import * as events from 'events';

export class QueueService extends events.EventEmitter {
  queues: any = {};

  constructor() {
    super();
    this.setMaxListeners(0);
  }
  queue = (key: string, promise: any) => {
    const existing = this.queues[key] || Promise.resolve();
    return (this.queues[key] = existing.then(() => promise()));
  };
}
