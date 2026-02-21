-- AlterTable
ALTER TABLE "session" ADD COLUMN "token" TEXT;

-- Populate token column with unique values for existing records
UPDATE "session" SET "token" = encode(gen_random_bytes(32), 'hex') WHERE "token" IS NULL;

-- Make token NOT NULL and add unique constraint
ALTER TABLE "session" ALTER COLUMN "token" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");
