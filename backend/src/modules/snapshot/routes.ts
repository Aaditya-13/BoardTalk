import { Router } from "express";

import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { saveSnapshotSchema } from "./schema.js";
import { snapshotController } from "./controller.js";

const router = Router();

router.use(authenticate);

router.get("/:boardId/snapshots/latest", snapshotController.getLatestSnapshot);

router.post(
  "/:boardId/snapshots",
  validate(saveSnapshotSchema),
  snapshotController.saveSnapshot
);

export default router;