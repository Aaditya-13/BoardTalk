-- AlterTable
ALTER TABLE "Board" ADD COLUMN     "thumbnailUrl" TEXT;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "shapeId" TEXT;

-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "revokedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isGuest" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "provider" DROP NOT NULL,
ALTER COLUMN "providerId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "StarredBoard" (
    "userId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StarredBoard_pkey" PRIMARY KEY ("userId","boardId")
);

-- AddForeignKey
ALTER TABLE "StarredBoard" ADD CONSTRAINT "StarredBoard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StarredBoard" ADD CONSTRAINT "StarredBoard_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
