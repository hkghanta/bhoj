-- CreateEnum
CREATE TYPE "CollaboratorRole" AS ENUM ('PLANNER', 'COORDINATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "CollaboratorPerm" AS ENUM ('VIEW', 'EDIT', 'ADMIN');

-- CreateEnum
CREATE TYPE "CoordinatorStatus" AS ENUM ('ASSIGNED', 'ACTIVE', 'COMPLETED', 'REASSIGNED');

-- CreateEnum
CREATE TYPE "CoordinatorPriority" AS ENUM ('STANDARD', 'HIGH', 'VIP');

-- AlterEnum
ALTER TYPE "VendorType" ADD VALUE 'EVENT_MANAGER';

-- CreateTable
CREATE TABLE "EventCollaborator" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "customer_id" TEXT,
    "role" "CollaboratorRole" NOT NULL DEFAULT 'PLANNER',
    "permissions" "CollaboratorPerm" NOT NULL DEFAULT 'EDIT',
    "invite_token" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventCoordinator" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "staff_name" TEXT NOT NULL,
    "staff_email" TEXT NOT NULL,
    "staff_phone" TEXT,
    "staff_avatar" TEXT,
    "status" "CoordinatorStatus" NOT NULL DEFAULT 'ASSIGNED',
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "priority" "CoordinatorPriority" NOT NULL DEFAULT 'STANDARD',

    CONSTRAINT "EventCoordinator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventCollaborator_invite_token_key" ON "EventCollaborator"("invite_token");

-- CreateIndex
CREATE INDEX "EventCollaborator_event_id_idx" ON "EventCollaborator"("event_id");

-- CreateIndex
CREATE INDEX "EventCollaborator_customer_id_idx" ON "EventCollaborator"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "EventCollaborator_event_id_email_key" ON "EventCollaborator"("event_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "EventCoordinator_event_id_key" ON "EventCoordinator"("event_id");

-- CreateIndex
CREATE INDEX "EventCoordinator_staff_email_idx" ON "EventCoordinator"("staff_email");

-- AddForeignKey
ALTER TABLE "EventCollaborator" ADD CONSTRAINT "EventCollaborator_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCoordinator" ADD CONSTRAINT "EventCoordinator_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
