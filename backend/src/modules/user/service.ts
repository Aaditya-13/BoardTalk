import type {
  Prisma,
  User,
} from "../../generated/prisma/client.js";

import { userRepository } from "./repository.js";

class UserService {
  async getUserById(id: string) {
    return userRepository.findById(id);
  }

  async getUserByEmail(email: string) {
    return userRepository.findByEmail(email);
  }

  async updateProfile(
    userId: string,
    data: Prisma.UserUpdateInput
  ) {
    return userRepository.update(userId, data);
  }

  async deleteAccount(userId: string) {
    return userRepository.delete(userId);
  }
}

export const userService = new UserService();