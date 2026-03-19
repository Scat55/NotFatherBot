/*
  Warnings:

  - You are about to drop the column `userId` on the `Wish` table. All the data in the column will be lost.
  - Added the required column `cycleId` to the `Wish` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Wish" DROP CONSTRAINT "Wish_userId_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "telegramId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Wish" DROP COLUMN "userId",
ADD COLUMN     "cycleId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Couple" (
    "id" SERIAL NOT NULL,
    "girlId" INTEGER NOT NULL,
    "boyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Couple_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cycle" (
    "id" SERIAL NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "cycleLength" INTEGER NOT NULL,
    "coupleId" INTEGER NOT NULL,

    CONSTRAINT "Cycle_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Couple" ADD CONSTRAINT "Couple_girlId_fkey" FOREIGN KEY ("girlId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Couple" ADD CONSTRAINT "Couple_boyId_fkey" FOREIGN KEY ("boyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cycle" ADD CONSTRAINT "Cycle_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wish" ADD CONSTRAINT "Wish_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
