-- CreateEnum
CREATE TYPE "NegotiationAction" AS ENUM ('COUNTER_OFFER', 'MENU_CHANGE', 'REVISION', 'MESSAGE');

-- CreateEnum
CREATE TYPE "StationPricing" AS ENUM ('FLAT', 'PER_PERSON', 'HOURLY');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'SENT', 'SIGNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SignatureType" AS ENUM ('DRAWN', 'TYPED');

-- CreateEnum
CREATE TYPE "AmendmentStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'REJECTED');

-- AlterEnum
ALTER TYPE "QuoteStatus" ADD VALUE 'NEGOTIATING';

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "is_auto_generated" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "QuoteNegotiation" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "sender_type" "SenderType" NOT NULL,
    "message" TEXT,
    "suggested_total" DECIMAL(10,2),
    "suggested_per_head" DECIMAL(10,2),
    "menu_changes" JSONB,
    "proposed_menu" JSONB,
    "action_type" "NegotiationAction" NOT NULL DEFAULT 'COUNTER_OFFER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteNegotiation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoQuoteRule" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "event_types" TEXT[],
    "guest_count_min" INTEGER,
    "guest_count_max" INTEGER,
    "cuisine_match" TEXT[],
    "menu_package_id" TEXT,
    "markup_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "include_delivery" BOOLEAN NOT NULL DEFAULT false,
    "auto_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoQuoteRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationTemplate" (
    "id" TEXT NOT NULL,
    "station_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "typical_min_guests" INTEGER,
    "typical_max_guests" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorStation" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "station_template_id" TEXT NOT NULL,
    "pricing_model" "StationPricing" NOT NULL DEFAULT 'PER_PERSON',
    "base_price" DECIMAL(10,2),
    "price_per_person" DECIMAL(10,2),
    "hourly_rate" DECIMAL(10,2),
    "min_guests" INTEGER,
    "max_guests" INTEGER,
    "includes_chef" BOOLEAN NOT NULL DEFAULT true,
    "includes_equipment" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "photos" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorEquipment" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "equipment_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_per_unit" DECIMAL(10,2),
    "price_per_event" DECIMAL(10,2),
    "quantity_available" INTEGER NOT NULL DEFAULT 1,
    "min_rental_hours" INTEGER NOT NULL DEFAULT 4,
    "photos" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorStaffListing" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "staff_role_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hourly_rate" DECIMAL(10,2) NOT NULL,
    "min_hours" INTEGER NOT NULL DEFAULT 4,
    "max_staff_available" INTEGER NOT NULL DEFAULT 1,
    "includes_uniform" BOOLEAN NOT NULL DEFAULT false,
    "background_checked" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorStaffListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancellationPolicy" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "hours_before_event" INTEGER NOT NULL,
    "refund_percent" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "CancellationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractTemplate" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "terms_and_conditions" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "contract_number" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "quote_id" TEXT,
    "event_id" TEXT,
    "template_id" TEXT,
    "content" TEXT NOT NULL,
    "terms_and_conditions" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractSignature" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "signer_id" TEXT NOT NULL,
    "signer_role" "SenderType" NOT NULL,
    "signer_name" TEXT NOT NULL,
    "signature_data" TEXT NOT NULL,
    "signature_type" "SignatureType" NOT NULL DEFAULT 'TYPED',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractAmendment" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "proposed_by" TEXT NOT NULL,
    "proposed_by_role" "SenderType" NOT NULL,
    "description" TEXT NOT NULL,
    "new_total" DECIMAL(10,2),
    "status" "AmendmentStatus" NOT NULL DEFAULT 'PROPOSED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "ContractAmendment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteNegotiation_quote_id_idx" ON "QuoteNegotiation"("quote_id");

-- CreateIndex
CREATE INDEX "AutoQuoteRule_vendor_id_idx" ON "AutoQuoteRule"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "StationTemplate_station_key_key" ON "StationTemplate"("station_key");

-- CreateIndex
CREATE INDEX "VendorStation_vendor_id_idx" ON "VendorStation"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "VendorStation_vendor_id_station_template_id_key" ON "VendorStation"("vendor_id", "station_template_id");

-- CreateIndex
CREATE INDEX "VendorEquipment_vendor_id_idx" ON "VendorEquipment"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "VendorEquipment_vendor_id_equipment_key_key" ON "VendorEquipment"("vendor_id", "equipment_key");

-- CreateIndex
CREATE INDEX "VendorStaffListing_vendor_id_idx" ON "VendorStaffListing"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "VendorStaffListing_vendor_id_staff_role_key_key" ON "VendorStaffListing"("vendor_id", "staff_role_key");

-- CreateIndex
CREATE INDEX "CancellationPolicy_vendor_id_idx" ON "CancellationPolicy"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "CancellationPolicy_vendor_id_hours_before_event_key" ON "CancellationPolicy"("vendor_id", "hours_before_event");

-- CreateIndex
CREATE INDEX "ContractTemplate_vendor_id_idx" ON "ContractTemplate"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contract_number_key" ON "Contract"("contract_number");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_quote_id_key" ON "Contract"("quote_id");

-- CreateIndex
CREATE INDEX "Contract_vendor_id_idx" ON "Contract"("vendor_id");

-- CreateIndex
CREATE INDEX "Contract_customer_id_idx" ON "Contract"("customer_id");

-- CreateIndex
CREATE INDEX "ContractSignature_contract_id_idx" ON "ContractSignature"("contract_id");

-- CreateIndex
CREATE INDEX "ContractAmendment_contract_id_idx" ON "ContractAmendment"("contract_id");

-- AddForeignKey
ALTER TABLE "QuoteNegotiation" ADD CONSTRAINT "QuoteNegotiation_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoQuoteRule" ADD CONSTRAINT "AutoQuoteRule_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoQuoteRule" ADD CONSTRAINT "AutoQuoteRule_menu_package_id_fkey" FOREIGN KEY ("menu_package_id") REFERENCES "MenuPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorStation" ADD CONSTRAINT "VendorStation_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorStation" ADD CONSTRAINT "VendorStation_station_template_id_fkey" FOREIGN KEY ("station_template_id") REFERENCES "StationTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorEquipment" ADD CONSTRAINT "VendorEquipment_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorStaffListing" ADD CONSTRAINT "VendorStaffListing_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancellationPolicy" ADD CONSTRAINT "CancellationPolicy_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractTemplate" ADD CONSTRAINT "ContractTemplate_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "ContractTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractSignature" ADD CONSTRAINT "ContractSignature_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractAmendment" ADD CONSTRAINT "ContractAmendment_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

