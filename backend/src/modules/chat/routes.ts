import { Router } from "express";

import { authenticate } from "../../middlewares/auth.js";
import { chatController } from "./controller.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get("/", chatController.getHistory);

export default router;
