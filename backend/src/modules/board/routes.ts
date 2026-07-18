import { Router } from "express";

import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { boardController } from "./controller.js";
import { createBoardSchema } from "./schema.js";

const router = Router();

router.use(authenticate);

router.post("/", validate(createBoardSchema), boardController.createBoard);

export default router;