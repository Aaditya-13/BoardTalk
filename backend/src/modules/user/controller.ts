import type { Request, Response } from "express";
import { userService } from "./service.js";

class UserController {
  async getCurrentUser(req: Request, res: Response) {
    const user = await userService.getUserById(req.user!.id);

    return res.status(200).json({
      success: true,
      data: user,
    });
  }

  async updateProfile(req: Request, res: Response) {
    const user = await userService.updateProfile(
      req.user!.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      data: user,
    });
  }

  async uploadAvatar(req: Request, res: Response) {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image provided" });
    }

    const avatarUrl = req.file.path;

    const user = await userService.updateProfile(req.user!.id, {
      avatarUrl,
    });

    return res.status(200).json({
      success: true,
      data: user,
    });
  }

  async deleteAccount(req: Request, res: Response) {
    await userService.deleteAccount(req.user!.id);

    return res.status(204).send();
  }
}

export const userController = new UserController();