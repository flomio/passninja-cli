import * as express from 'express';
import { HttpError, InternalServerError, BadRequest } from 'http-errors';
import { dbg } from '../logging';

export class ExpressAppHolder {
  expressApp = express();
}

export const handleGet = ({ handler, json = true }: any) => async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const responseBody = await handler.handle({
      req: req,
      res: res,
      body: null
    });

    if (!json) {
      res.send(responseBody);
    } else {
      res.json(responseBody);
    }
  } catch (err) {
    if (err instanceof HttpError) {
      next(err);
    } else {
      dbg('Error handling:', { url: req.url, body: req.body }, err);
      next(new InternalServerError());
    }
  }
};

export const handlePost = ({
  handler,
  allowNoContentType = false
}: any) => async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    if (
      !allowNoContentType &&
      req.header('content-type') !== 'application/json'
    ) {
      return next(new BadRequest('Must set Content-Type to application/json'));
    }

    const responseBody = await handler.handle({
      body: req.body,
      req: req,
      res: res
    });

    if (responseBody != null) {
      res.json(responseBody);
    } else {
      // res.status(200)
    }
  } catch (err) {
    if (err instanceof HttpError) {
      next(err);
    } else {
      dbg('Error handling:', { url: req.url, body: req.body }, err);
      next(new InternalServerError());
    }
  }
};
