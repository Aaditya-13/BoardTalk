import { Router } from "express";

import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { boardController } from "./controller.js";
import {
	createBoardSchema,
	updateBoardSchema,
} from "./schema.js";

const router = Router();

router.use(authenticate);

router.get("/", boardController.listBoards);

router.post("/", validate(createBoardSchema), boardController.createBoard);

router.get("/:boardId", boardController.getBoard);

router.patch(
	"/:boardId",
	validate(updateBoardSchema),
	boardController.updateBoard
);

router.post("/:boardId/star", boardController.toggleStar);

router.delete("/:boardId", boardController.deleteBoard);

export default router;