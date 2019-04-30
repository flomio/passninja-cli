import { Subscription } from 'rxjs';

declare type CleanUpFunction = () => any;

class CleanUpService {
  _items: CleanUpFunction[] = [];

  constructor() {
    this._setup();
  }

  private _setup() {
    process.on('exit', () => {
      this._items.forEach(fn => {
        try {
          fn();
        } catch (err) {
          console.error(`error cleaning up ${err.message}`);
        }
      });

      this._items = [];
    });
  }

  register = (fn: CleanUpFunction) => this._items.push(fn);
}

let cleanUpService: CleanUpService;

if (!cleanUpService!) {
  cleanUpService = new CleanUpService();
}

export { cleanUpService };
