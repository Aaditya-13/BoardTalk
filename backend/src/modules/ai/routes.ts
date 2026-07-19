import { Router } from "express";

import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { aiCommandSchema } from "./schema.js";
import { aiController } from "./controller.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

// POST /api/v1/boards/:boardId/ai/generate
router.post(
  "/generate",
  validate(aiCommandSchema),
  (req, res) => aiController.generate(req, res)
);

export default router;
