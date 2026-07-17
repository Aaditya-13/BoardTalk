import express from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";

import { env } from "./config/env";
import { logger } from "./lib/logger";

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(helmet());

app.use(compression());

app.use(
  pinoHttp({
    logger,
  }),
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "BoardTalk API is running",
    version: "1.0.0",
  });
});

export default app;