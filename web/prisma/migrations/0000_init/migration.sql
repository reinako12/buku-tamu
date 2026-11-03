-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "visit_status" AS ENUM ('menunggu', 'dipanggil', 'dilayani', 'selesai', 'batal');

-- CreateEnum
CREATE TYPE "staff_role" AS ENUM ('petugas', 'admin');

-- CreateEnum
CREATE TYPE "visit_source" AS ENUM ('mandiri', 'manual');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "staff_role" NOT NULL DEFAULT 'petugas',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token" UUID NOT NULL DEFAULT gen_random_uuid(),
    "queue_date" DATE NOT NULL,
    "queue_seq" INTEGER NOT NULL,
    "queue_no" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "institution_cat" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "detail" TEXT,
    "person_count" SMALLINT NOT NULL DEFAULT 1,
    "status" "visit_status" NOT NULL DEFAULT 'menunggu',
    "source" "visit_source" NOT NULL DEFAULT 'mandiri',
    "handled_by" UUID,
    "internal_note" TEXT,
    "check_in_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "check_out_at" TIMESTAMPTZ(6),

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" SMALLINT NOT NULL DEFAULT 1,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "closed_reason" TEXT,
    "reopen_at" TIMESTAMPTZ(6),
    "auto_reopen" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "visits_token_key" ON "visits"("token");

-- CreateIndex
CREATE UNIQUE INDEX "visits_queue_no_key" ON "visits"("queue_no");

-- CreateIndex
CREATE INDEX "visits_queue_date_queue_seq_idx" ON "visits"("queue_date" DESC, "queue_seq" DESC);

-- CreateIndex
CREATE INDEX "visits_status_idx" ON "visits"("status");

-- CreateIndex
CREATE INDEX "visits_phone_idx" ON "visits"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "visits_queue_date_queue_seq_key" ON "visits"("queue_date", "queue_seq");

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_handled_by_fkey" FOREIGN KEY ("handled_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

