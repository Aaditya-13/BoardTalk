import type { RequestHandler } from "express";

export const authenticate: RequestHandler = (
  _req,
  _res,
  next
) => {
  next();
};