-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('TOP_RATED', 'FAST_RESPONDER', 'POPULAR', 'NEW_VENDOR', 'VERIFIED', 'PREMIUM');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorBadge" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "badge_type" "BadgeType" NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "VendorBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSchedule" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Installment" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "stripe_payment_id" TEXT,

    CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Favorite_customer_id_idx" ON "Favorite"("customer_id");

-- CreateIndex
CREATE INDEX "Favorite_vendor_id_idx" ON "Favorite"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_customer_id_vendor_id_key" ON "Favorite"("customer_id", "vendor_id");

-- CreateIndex
CREATE INDEX "VendorBadge_vendor_id_idx" ON "VendorBadge"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "VendorBadge_vendor_id_badge_type_key" ON "VendorBadge"("vendor_id", "badge_type");

-- CreateIndex
CREATE INDEX "PaymentSchedule_customer_id_idx" ON "PaymentSchedule"("customer_id");

-- CreateIndex
CREATE INDEX "PaymentSchedule_event_id_idx" ON "PaymentSchedule"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSchedule_quote_id_key" ON "PaymentSchedule"("quote_id");

-- CreateIndex
CREATE INDEX "Installment_schedule_id_idx" ON "Installment"("schedule_id");

-- CreateIndex
CREATE INDEX "Installment_due_date_idx" ON "Installment"("due_date");

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBadge" ADD CONSTRAINT "VendorBadge_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSchedule" ADD CONSTRAINT "PaymentSchedule_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSchedule" ADD CONSTRAINT "PaymentSchedule_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSchedule" ADD CONSTRAINT "PaymentSchedule_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "PaymentSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
