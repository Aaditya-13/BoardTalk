import { Router } from "express";

import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { createInviteSchema } from "./schema.js";
import { inviteController } from "./controller.js";

const router = Router();

router.use(authenticate);

router.get("/:boardId/invites", inviteController.listInvites);

router.post(
  "/:boardId/invites",
  validate(createInviteSchema),
  inviteController.createInvite
);

router.delete("/:boardId/invites/:inviteId", inviteController.revokeInvite);

export default router;