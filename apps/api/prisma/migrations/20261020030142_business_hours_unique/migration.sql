/*
  Warnings:

  - You are about to drop the `StaffAvailability` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[locationId,dayOfWeek]` on the table `BusinessHour` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "StaffAvailability" DROP CONSTRAINT "StaffAvailability_staffId_fkey";

-- DropTable
DROP TABLE "StaffAvailability";

-- CreateTable
CREATE TABLE "StaffSchedule" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "StaffSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffSchedule_staffId_dayOfWeek_key" ON "StaffSchedule"("staffId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessHour_locationId_dayOfWeek_key" ON "BusinessHour"("locationId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "StaffSchedule" ADD CONSTRAINT "StaffSchedule_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
