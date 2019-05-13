import {
  handlePost,
  handleGet,
  ExpressAppHolder
} from './services/express-app-holder';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import { TestHandler } from './http-handlers/test-handler';
import { LatestPassHandler } from './http-handlers/latest-pass';
import { dbg } from './logging';

export class RoutingAndConfiguration {
  constructor(
    private applicationHolder: ExpressAppHolder,
    private testHandler: TestHandler,
    private latestPass: LatestPassHandler
  ) {
    dbg('Adding routes');

    const app = applicationHolder.expressApp;

    app.use(cors());
    app.use(bodyParser.json());
    app.post('/test', handlePost({ handler: testHandler }));
    app.get('/latestPass', handleGet({ handler: latestPass, json: false }));
    app.get(
      '/latestPass.pkpass',
      handleGet({ handler: latestPass, json: false })
    );
    // app.use((error: Error,
    //          request: express.Request,
    //          response: express.Response,
    //          next: any) => {
    //
    // })
  }
}
