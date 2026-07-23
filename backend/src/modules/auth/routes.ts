import { Router } from "express";
import passport from "passport";

import { authController } from "./controller.js";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  authController.googleCallback
);

router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
  })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: "/login",
  }),
  authController.githubCallback
);

router.post("/guest", authController.guestLogin);

// router.post("/dev-login", authController.devLogin);

router.post("/refresh", authController.refresh);

router.post("/logout", authController.logout);

export default router;