import { Request, Response, RequestHandler } from 'express';
import * as React from 'react';
import { renderToString } from 'react-dom/server'

export function jsxHandler(
  f: (req: Request, res: Response) => Promise<React.JSX.Element>
): RequestHandler {
  return async (req: Request, res: Response) => {
    const jsx = await f(req, res);
    const html = `<!doctype html>\n${renderToString(jsx)}`;
    res.contentType('text/html');
    res.send(html);
  }
}