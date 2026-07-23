import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";
import "./config/passport";
import { logger } from "./lib/logger";
import { errorHandler } from "./middlewares/error";
import authRoutes from "./modules/auth/routes";
import boardRoutes from "./modules/board/routes";
import inviteRoutes from "./modules/invite/routes";
import publicInviteRoutes from "./modules/invite/public.routes";
import collaboratorRoutes from "./modules/collaborator/routes";
import snapshotRoutes from "./modules/snapshot/routes";
import commentRoutes from "./modules/comment/routes";
import chatRoutes from "./modules/chat/routes";
import aiRoutes from "./modules/ai/routes";
import userRoutes from "./modules/user/routes";

const app = express();

app.set("trust proxy", 1);

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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per `window` (here, per 15 minutes)
  message: "Too many authentication requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window`
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/v1/", apiLimiter);
app.use("/api/v1/auth", authLimiter, authRoutes);

app.use("/api/v1/boards", boardRoutes);

app.use("/api/v1/boards", collaboratorRoutes);

app.use("/api/v1/boards", inviteRoutes);

app.use("/api/v1/boards", snapshotRoutes);

app.use("/api/v1/boards/:boardId/comments", commentRoutes);

app.use("/api/v1/boards/:boardId/chat", chatRoutes);

app.use("/api/v1/boards/:boardId/ai", aiRoutes);

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