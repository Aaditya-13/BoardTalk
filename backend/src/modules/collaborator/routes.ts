import { Router } from "express";

import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { updateCollaboratorRoleSchema } from "./schema.js";
import { collaboratorController } from "./controller.js";

const router = Router();

router.use(authenticate);

router.get("/:boardId/membership/me", collaboratorController.getMyMembership);

router.get("/:boardId/collaborators", collaboratorController.listCollaborators);

router.patch(
	"/:boardId/collaborators/:collaboratorId",
	validate(updateCollaboratorRoleSchema),
	collaboratorController.updateCollaboratorRole
);

router.delete(
	"/:boardId/collaborators/:collaboratorId",
	collaboratorController.removeCollaborator
);

export default router;