import { Router } from "express";

import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { commentController } from "./controller.js";
import {
  createCommentSchema,
  updateCommentSchema,
  resolveCommentSchema,
} from "./schema.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get("/", commentController.listComments);

router.post("/", validate(createCommentSchema), commentController.createComment);

router.patch(
  "/:commentId",
  validate(updateCommentSchema),
  commentController.updateComment
);

router.patch(
  "/:commentId/resolve",
  validate(resolveCommentSchema),
  commentController.resolveComment
);

router.delete("/:commentId", commentController.deleteComment);

export default router;
