import { HttpServer } from './http-server';
import { Server, WebSocket } from 'ws';
import { dbg } from '../logging';

export class SocketServerService {
  private _server: Server;
  private _sockets: Set<WebSocket>;

  constructor(private server: HttpServer) {
    this._server = new Server({ server: this.server.serverRef });
    this._sockets = new Set();
    this._server.on('connection', (ws: WebSocket) => {
      dbg('Socket connected!');

      this._sockets.add(ws);

      ws.on('message', (message: any) => {});

      ws.on('close', (code: number) => {
        dbg('Socket closed!', code);
        this._sockets.delete(ws);
      });
    });
  }

  sendAll = (message: any) => {
    const serialized = JSON.stringify(message);
    let sent = 0;

    this._sockets.forEach((ws: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(serialized);
        sent++;
      }
    });

    return sent;
  };
}
