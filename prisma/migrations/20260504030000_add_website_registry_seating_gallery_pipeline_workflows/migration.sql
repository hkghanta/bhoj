-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('INQUIRY', 'PROPOSAL_SENT', 'TASTING_SCHEDULED', 'NEGOTIATING', 'CONTRACT_SENT', 'BOOKED', 'IN_PROGRESS', 'COMPLETED', 'LOST');

-- CreateEnum
CREATE TYPE "WorkflowTrigger" AS ENUM ('NEW_LEAD', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'CONTRACT_SIGNED', 'EVENT_UPCOMING_7D', 'EVENT_UPCOMING_1D', 'EVENT_COMPLETED', 'NO_RESPONSE_48H');

-- CreateEnum
CREATE TYPE "TastingStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "EventWebsite" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'classic',
    "hero_photo" TEXT,
    "our_story" TEXT,
    "travel_info" TEXT,
    "accommodation" TEXT,
    "faq" JSONB,
    "sections" JSONB,
    "colors" JSONB,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "custom_domain" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventWebsite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftRegistry" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Gift Registry',
    "message" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftRegistryItem" (
    "id" TEXT NOT NULL,
    "registry_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "category" TEXT,
    "target_amount" DECIMAL(10,2),
    "current_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "external_url" TEXT,
    "is_cash_fund" BOOLEAN NOT NULL DEFAULT false,
    "is_fulfilled" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftRegistryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftContribution" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "guest_name" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "message" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatingChart" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "sub_event_id" TEXT,
    "name" TEXT NOT NULL DEFAULT 'Main Seating',
    "layout" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeatingChart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatingTable" (
    "id" TEXT NOT NULL,
    "chart_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shape" TEXT NOT NULL DEFAULT 'round',
    "capacity" INTEGER NOT NULL DEFAULT 8,
    "x_position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "y_position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "SeatingTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatAssignment" (
    "id" TEXT NOT NULL,
    "table_id" TEXT NOT NULL,
    "household_id" TEXT,
    "attendee_id" TEXT,
    "seat_number" INTEGER,

    CONSTRAINT "SeatAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTimelineEntry" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "sub_event_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "category" TEXT,
    "vendor_id" TEXT,
    "vendor_name" TEXT,
    "location" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventTimelineEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventGalleryPhoto" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "uploaded_by" TEXT,
    "photo_url" TEXT NOT NULL,
    "caption" TEXT,
    "category" TEXT,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventGalleryPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventGalleryTag" (
    "id" TEXT NOT NULL,
    "photo_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "role" TEXT,

    CONSTRAINT "EventGalleryTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstantBookPackage" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "vendor_type" "VendorType" NOT NULL,
    "price_type" TEXT NOT NULL DEFAULT 'FLAT',
    "price" DECIMAL(10,2) NOT NULL,
    "min_guests" INTEGER,
    "max_guests" INTEGER,
    "min_hours" INTEGER,
    "includes" JSONB,
    "photos" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "advance_notice_hours" INTEGER NOT NULL DEFAULT 72,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstantBookPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPipelineEntry" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "match_id" TEXT,
    "quote_id" TEXT,
    "stage" "PipelineStage" NOT NULL DEFAULT 'INQUIRY',
    "notes" TEXT,
    "follow_up_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPipelineEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorWorkflow" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "trigger" "WorkflowTrigger" NOT NULL,
    "conditions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowAction" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "delay_hours" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WorkflowAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StyleQuizResponse" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "preferences" JSONB NOT NULL,
    "liked_photos" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StyleQuizResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoodBoard" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "event_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "share_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoodBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoodBoardItem" (
    "id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "source_url" TEXT,
    "caption" TEXT,
    "category" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoodBoardItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventInvitationDesign" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'traditional',
    "design_data" JSONB,
    "preview_url" TEXT,
    "is_digital" BOOLEAN NOT NULL DEFAULT true,
    "is_physical" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventInvitationDesign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorMessageTemplate" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorMessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorCalendarSync" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "calendar_url" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "last_synced_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorCalendarSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TastingBooking" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "event_id" TEXT,
    "quote_id" TEXT,
    "booking_type" TEXT NOT NULL DEFAULT 'TASTING',
    "date" TIMESTAMP(3) NOT NULL,
    "time_slot" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "status" "TastingStatus" NOT NULL DEFAULT 'REQUESTED',
    "guest_count" INTEGER NOT NULL DEFAULT 2,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TastingBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventWebsite_event_id_key" ON "EventWebsite"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "EventWebsite_slug_key" ON "EventWebsite"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "GiftRegistry_event_id_key" ON "GiftRegistry"("event_id");

-- CreateIndex
CREATE INDEX "GiftRegistryItem_registry_id_idx" ON "GiftRegistryItem"("registry_id");

-- CreateIndex
CREATE INDEX "GiftContribution_item_id_idx" ON "GiftContribution"("item_id");

-- CreateIndex
CREATE INDEX "SeatingChart_event_id_idx" ON "SeatingChart"("event_id");

-- CreateIndex
CREATE INDEX "SeatingTable_chart_id_idx" ON "SeatingTable"("chart_id");

-- CreateIndex
CREATE INDEX "SeatAssignment_table_id_idx" ON "SeatAssignment"("table_id");

-- CreateIndex
CREATE INDEX "SeatAssignment_household_id_idx" ON "SeatAssignment"("household_id");

-- CreateIndex
CREATE INDEX "EventTimelineEntry_event_id_idx" ON "EventTimelineEntry"("event_id");

-- CreateIndex
CREATE INDEX "EventTimelineEntry_start_time_idx" ON "EventTimelineEntry"("start_time");

-- CreateIndex
CREATE INDEX "EventGalleryPhoto_event_id_idx" ON "EventGalleryPhoto"("event_id");

-- CreateIndex
CREATE INDEX "EventGalleryPhoto_category_idx" ON "EventGalleryPhoto"("category");

-- CreateIndex
CREATE INDEX "EventGalleryTag_vendor_id_idx" ON "EventGalleryTag"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "EventGalleryTag_photo_id_vendor_id_key" ON "EventGalleryTag"("photo_id", "vendor_id");

-- CreateIndex
CREATE INDEX "InstantBookPackage_vendor_id_idx" ON "InstantBookPackage"("vendor_id");

-- CreateIndex
CREATE INDEX "InstantBookPackage_vendor_type_idx" ON "InstantBookPackage"("vendor_type");

-- CreateIndex
CREATE INDEX "InstantBookPackage_is_active_idx" ON "InstantBookPackage"("is_active");

-- CreateIndex
CREATE INDEX "VendorPipelineEntry_vendor_id_idx" ON "VendorPipelineEntry"("vendor_id");

-- CreateIndex
CREATE INDEX "VendorPipelineEntry_stage_idx" ON "VendorPipelineEntry"("stage");

-- CreateIndex
CREATE INDEX "VendorWorkflow_vendor_id_idx" ON "VendorWorkflow"("vendor_id");

-- CreateIndex
CREATE INDEX "WorkflowAction_workflow_id_idx" ON "WorkflowAction"("workflow_id");

-- CreateIndex
CREATE UNIQUE INDEX "StyleQuizResponse_customer_id_key" ON "StyleQuizResponse"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "MoodBoard_share_token_key" ON "MoodBoard"("share_token");

-- CreateIndex
CREATE INDEX "MoodBoard_customer_id_idx" ON "MoodBoard"("customer_id");

-- CreateIndex
CREATE INDEX "MoodBoard_event_id_idx" ON "MoodBoard"("event_id");

-- CreateIndex
CREATE INDEX "MoodBoardItem_board_id_idx" ON "MoodBoardItem"("board_id");

-- CreateIndex
CREATE UNIQUE INDEX "EventInvitationDesign_event_id_key" ON "EventInvitationDesign"("event_id");

-- CreateIndex
CREATE INDEX "VendorMessageTemplate_vendor_id_idx" ON "VendorMessageTemplate"("vendor_id");

-- CreateIndex
CREATE INDEX "VendorCalendarSync_vendor_id_idx" ON "VendorCalendarSync"("vendor_id");

-- CreateIndex
CREATE INDEX "TastingBooking_vendor_id_idx" ON "TastingBooking"("vendor_id");

-- CreateIndex
CREATE INDEX "TastingBooking_customer_id_idx" ON "TastingBooking"("customer_id");

-- CreateIndex
CREATE INDEX "TastingBooking_date_idx" ON "TastingBooking"("date");

-- AddForeignKey
ALTER TABLE "EventWebsite" ADD CONSTRAINT "EventWebsite_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftRegistry" ADD CONSTRAINT "GiftRegistry_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftRegistryItem" ADD CONSTRAINT "GiftRegistryItem_registry_id_fkey" FOREIGN KEY ("registry_id") REFERENCES "GiftRegistry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftContribution" ADD CONSTRAINT "GiftContribution_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "GiftRegistryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftContribution" ADD CONSTRAINT "GiftContribution_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatingChart" ADD CONSTRAINT "SeatingChart_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatingTable" ADD CONSTRAINT "SeatingTable_chart_id_fkey" FOREIGN KEY ("chart_id") REFERENCES "SeatingChart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatAssignment" ADD CONSTRAINT "SeatAssignment_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "SeatingTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTimelineEntry" ADD CONSTRAINT "EventTimelineEntry_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventGalleryPhoto" ADD CONSTRAINT "EventGalleryPhoto_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventGalleryTag" ADD CONSTRAINT "EventGalleryTag_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "EventGalleryPhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventGalleryTag" ADD CONSTRAINT "EventGalleryTag_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstantBookPackage" ADD CONSTRAINT "InstantBookPackage_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPipelineEntry" ADD CONSTRAINT "VendorPipelineEntry_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorWorkflow" ADD CONSTRAINT "VendorWorkflow_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowAction" ADD CONSTRAINT "WorkflowAction_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "VendorWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StyleQuizResponse" ADD CONSTRAINT "StyleQuizResponse_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoodBoard" ADD CONSTRAINT "MoodBoard_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoodBoard" ADD CONSTRAINT "MoodBoard_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoodBoardItem" ADD CONSTRAINT "MoodBoardItem_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "MoodBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInvitationDesign" ADD CONSTRAINT "EventInvitationDesign_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorMessageTemplate" ADD CONSTRAINT "VendorMessageTemplate_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorCalendarSync" ADD CONSTRAINT "VendorCalendarSync_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

