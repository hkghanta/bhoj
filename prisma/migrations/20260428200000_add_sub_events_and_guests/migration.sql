-- CreateEnum
CREATE TYPE "GuestDietaryType" AS ENUM ('NON_VEG', 'VEGETARIAN', 'VEGAN', 'JAIN', 'HALAL');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "invite_image_url" TEXT,
ADD COLUMN     "invite_message" TEXT;

-- AlterTable
ALTER TABLE "EventChecklistItem" ADD COLUMN     "sub_event_id" TEXT;

-- AlterTable
ALTER TABLE "EventRequest" ADD COLUMN     "sub_event_id" TEXT;

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "calories_per_serving" INTEGER,
ADD COLUMN     "carbs_g" DECIMAL(6,1),
ADD COLUMN     "fat_g" DECIMAL(6,1),
ADD COLUMN     "ingredients" TEXT[],
ADD COLUMN     "is_global" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pending_review" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prep_notes" TEXT,
ADD COLUMN     "protein_g" DECIMAL(6,1),
ADD COLUMN     "proteins" TEXT[],
ADD COLUMN     "serves_description" TEXT;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "trial_ends_at" TIMESTAMP(3),
ALTER COLUMN "tier" SET DEFAULT 'PRO';

-- CreateTable
CREATE TABLE "SubEvent" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "guest_count" INTEGER,
    "budget" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestHousehold" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "token" TEXT NOT NULL,
    "declined" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestHousehold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestSubEventInvite" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "sub_event_id" TEXT NOT NULL,
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestSubEventInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestAttendee" (
    "id" TEXT NOT NULL,
    "invite_id" TEXT NOT NULL,
    "name" TEXT,
    "dietary_type" "GuestDietaryType" NOT NULL DEFAULT 'NON_VEG',
    "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorOperatingSchedule" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "day_of_week" TEXT NOT NULL,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "opens_at" TEXT,
    "closes_at" TEXT,
    "notes" TEXT,

    CONSTRAINT "VendorOperatingSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorSpecialDay" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "is_open" BOOLEAN NOT NULL DEFAULT false,
    "opens_at" TEXT,
    "closes_at" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorSpecialDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuestHousehold_token_key" ON "GuestHousehold"("token");

-- CreateIndex
CREATE UNIQUE INDEX "GuestSubEventInvite_household_id_sub_event_id_key" ON "GuestSubEventInvite"("household_id", "sub_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "VendorOperatingSchedule_vendor_id_day_of_week_key" ON "VendorOperatingSchedule"("vendor_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "VendorSpecialDay_vendor_id_date_key" ON "VendorSpecialDay"("vendor_id", "date");

-- AddForeignKey
ALTER TABLE "EventChecklistItem" ADD CONSTRAINT "EventChecklistItem_sub_event_id_fkey" FOREIGN KEY ("sub_event_id") REFERENCES "SubEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRequest" ADD CONSTRAINT "EventRequest_sub_event_id_fkey" FOREIGN KEY ("sub_event_id") REFERENCES "SubEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubEvent" ADD CONSTRAINT "SubEvent_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestHousehold" ADD CONSTRAINT "GuestHousehold_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestSubEventInvite" ADD CONSTRAINT "GuestSubEventInvite_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "GuestHousehold"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestSubEventInvite" ADD CONSTRAINT "GuestSubEventInvite_sub_event_id_fkey" FOREIGN KEY ("sub_event_id") REFERENCES "SubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestAttendee" ADD CONSTRAINT "GuestAttendee_invite_id_fkey" FOREIGN KEY ("invite_id") REFERENCES "GuestSubEventInvite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorOperatingSchedule" ADD CONSTRAINT "VendorOperatingSchedule_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorSpecialDay" ADD CONSTRAINT "VendorSpecialDay_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

