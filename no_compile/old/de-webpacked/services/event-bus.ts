import * as events from 'events';

export class EventBus extends events.EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(0);
  }
}
