import { StateStoreService } from '../services/store';

export class LatestPassHandler {
  constructor(private store: StateStoreService) {}

  handle = (args: any) => {
    const res = args.res;

    const pass = this.store.latestPkPass.getValue();

    if (pass === null) {
      res.status(404);
      return Buffer.alloc(0);
    }

    res.header('Content-Type', 'application/vnd.pkpass');
    res.header('Last-Modified', new Date().toUTCString());
    return pass;
  };
}
