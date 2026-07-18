import { Router } from "express";

import { userController } from "./controller.js";
import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { updateProfileSchema } from "./schema.js";

const router = Router();

router.use(authenticate);

router.get("/me", userController.getCurrentUser);

router.patch(
  "/me",
  validate(updateProfileSchema),
  userController.updateProfile
);

router.delete(
  "/me",
  userController.deleteAccount
);

export default router;