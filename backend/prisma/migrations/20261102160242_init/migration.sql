-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('QUEUED', 'EDITING_IMAGE', 'GENERATING_VIDEO', 'EXTRACTING_FRAMES', 'BUILDING_SPRITESHEET', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Generation" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'QUEUED',
    "errorMessage" TEXT,
    "imageGenerationMs" INTEGER,
    "videoGenerationMs" INTEGER,
    "frameExtractionMs" INTEGER,
    "spritesheetBuildMs" INTEGER,
    "totalMs" INTEGER,
    "artifacts" JSONB,
    "providerCalls" JSONB,
    "frameCount" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Generation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Generation_status_idx" ON "Generation"("status");

-- CreateIndex
CREATE INDEX "Generation_createdAt_idx" ON "Generation"("createdAt");
