import type {
  Prisma,
  User,
} from "../../generated/prisma/client.js";

import { userRepository } from "./repository.js";
import type { OAuthProfile } from "./types.js";

class UserService {
  async getUserById(id: string) {
    return userRepository.findById(id);
  }

  async getUserByEmail(email: string) {
    return userRepository.findByEmail(email);
  }

  async findOrCreateOAuthUser(profile: OAuthProfile): Promise<User> {
    const existingUser = await userRepository.findByProvider(
      profile.provider,
      profile.providerId
    );

    if (existingUser) {
      return existingUser;
    }

    const data: Prisma.UserCreateInput = {
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      provider: profile.provider,
      providerId: profile.providerId,
    };

    return userRepository.create(data);
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