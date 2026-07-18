import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import pinoHttp from "pino-http";

import { env } from "./config/env";
import "./config/passport";
import { logger } from "./lib/logger";
import { errorHandler } from "./middlewares/error";
import authRoutes from "./modules/auth/routes";
import boardRoutes from "./modules/board/routes";
import inviteRoutes from "./modules/invite/routes";
import publicInviteRoutes from "./modules/invite/public.routes";
import collaboratorRoutes from "./modules/collaborator/routes";
import userRoutes from "./modules/user/routes";

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

app.use(cookieParser());

app.use(passport.initialize());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/boards", boardRoutes);

app.use("/api/v1/boards", collaboratorRoutes);

app.use("/api/v1/boards", inviteRoutes);

app.use("/api/v1/invites", publicInviteRoutes);

app.use("/api/v1/users", userRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "BoardTalk API is running",
    version: "1.0.0",
  });
});

app.use(errorHandler);

export default app;