import { Subscription } from 'rxjs';

export declare type CleanUpFunction = () => void;

export class CleanUpService {
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

  register = (fn: CleanUpFunction) => void this._items.push(fn);
}

// let cleanUpService: CleanUpService;

// if (!cleanUpService!) {
//   cleanUpService = new CleanUpService();
// }

// export { cleanUpService };
