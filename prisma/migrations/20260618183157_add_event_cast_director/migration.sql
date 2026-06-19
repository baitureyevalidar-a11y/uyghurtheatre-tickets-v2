-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "cast" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "director" TEXT;
