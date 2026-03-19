/*
  Warnings:

  - You are about to drop the column `boyId` on the `Couple` table. All the data in the column will be lost.
  - You are about to drop the column `girlId` on the `Couple` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `cycleId` on the `Wish` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[inviteToken]` on the table `Couple` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `creatorId` to the `Couple` table without a default value. This is not possible if the table is not empty.
  - Made the column `telegramId` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `coupleId` to the `Wish` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Couple" DROP CONSTRAINT "Couple_boyId_fkey";

-- DropForeignKey
ALTER TABLE "Couple" DROP CONSTRAINT "Couple_girlId_fkey";

-- DropForeignKey
ALTER TABLE "Cycle" DROP CONSTRAINT "Cycle_coupleId_fkey";

-- DropForeignKey
ALTER TABLE "Wish" DROP CONSTRAINT "Wish_cycleId_fkey";

-- AlterTable
ALTER TABLE "Couple" DROP COLUMN "boyId",
DROP COLUMN "girlId",
ADD COLUMN     "creatorId" INTEGER NOT NULL,
ADD COLUMN     "inviteExpiresAt" TIMESTAMP(3),
ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "partnerId" INTEGER;

-- AlterTable
ALTER TABLE "Cycle" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "balance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "username" TEXT,
ALTER COLUMN "telegramId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Wish" DROP COLUMN "cycleId",
ADD COLUMN     "cost" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "coupleId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "done" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CycleWishEntry" (
    "id" SERIAL NOT NULL,
    "cycleId" INTEGER NOT NULL,
    "wishText" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CycleWishEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramLogin" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "telegramId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TelegramLogin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramLogin_token_key" ON "TelegramLogin"("token");

-- CreateIndex
CREATE INDEX "TelegramLogin_token_idx" ON "TelegramLogin"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Couple_inviteToken_key" ON "Couple"("inviteToken");

-- AddForeignKey
ALTER TABLE "Couple" ADD CONSTRAINT "Couple_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Couple" ADD CONSTRAINT "Couple_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wish" ADD CONSTRAINT "Wish_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cycle" ADD CONSTRAINT "Cycle_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleWishEntry" ADD CONSTRAINT "CycleWishEntry_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
