import * as http from 'http';
import { dbg } from '../logging';
import { ExpressAppHolder } from './express-app-holder';

export class HttpServer {
  private _server: http.Server;

  get serverRef() {
    return this._server;
  }

  constructor(public options, public app: ExpressAppHolder) {
    this._server = http.createServer(this.app.expressApp);
  }

  listen = () => {
    const options = this.options.server;
    this._server.listen(options.port, options.hostname, () => {
      dbg('Listening on', options);
    });
  };
}
