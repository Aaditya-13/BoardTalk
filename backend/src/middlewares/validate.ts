import type {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";

import type { ZodType } from "zod";

export function validate(schema: ZodType): RequestHandler {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    try {
      req.body = await schema.parseAsync(req.body);

      next();
    } catch (error) {
      next(error);
    }
  };
}