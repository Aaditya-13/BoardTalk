import { Router } from "express";

import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { acceptInviteSchema } from "./accept.schema.js";
import { publicInviteController } from "./public.controller.js";

const router = Router();

router.use(authenticate);

router.post(
  "/accept",
  validate(acceptInviteSchema),
  publicInviteController.acceptInvite
);

export default router;