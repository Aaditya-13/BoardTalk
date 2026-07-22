// src/modules/user/repository.ts

import { prisma } from "../../lib/prisma.js";
import type {
  Prisma,
  AuthProvider,
} from "../../generated/prisma/client.js";

class UserRepository {
  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  findByProvider(provider: AuthProvider, providerId: string) {
    return prisma.user.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
    });
  }

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
    });
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  incrementAiPrompts(id: string) {
    return prisma.user.update({
      where: { id },
      data: {
        aiPromptsUsed: {
          increment: 1,
        },
      },
    });
  }

  delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }
}

export const userRepository = new UserRepository();