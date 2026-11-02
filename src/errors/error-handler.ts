import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from './app-error';

export const routeNotFound: RequestHandler = (req, res) => {
  res.status(404).json({
    error: { code: 'ROUTE_NOT_FOUND', message: `No route for ${req.method} ${req.path}` },
  });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  const type = typeof err === 'object' && err !== null && 'type' in err ? err.type : undefined;

  if (type === 'entity.parse.failed') {
    res
      .status(400)
      .json({ error: { code: 'MALFORMED_JSON', message: 'Request body is not valid JSON' } });
    return;
  }

  if (type === 'entity.too.large') {
    res
      .status(413)
      .json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
};
