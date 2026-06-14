import type { RequestHandler } from "express";

export function asyncHandler(
  handler: (req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    handler(req, res).catch(next);
  };
}
