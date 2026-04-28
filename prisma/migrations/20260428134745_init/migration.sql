-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('CATERER', 'DESSERT_VENDOR', 'BARTENDER', 'CHAI_STATION', 'FOOD_TRUCK', 'DECORATOR', 'FLORIST', 'TENT_MARQUEE', 'LIGHTING', 'FURNITURE_RENTAL', 'EQUIPMENT_RENTAL', 'DJ', 'LIVE_BAND', 'DHOL_PLAYER', 'CLASSICAL_MUSICIAN', 'GAMES_ENTERTAINMENT', 'PHOTOGRAPHER', 'VIDEOGRAPHER', 'MEHENDI_ARTIST', 'MAKEUP_HAIR', 'CHOREOGRAPHER', 'PANDIT_OFFICIANT', 'INVITATION_DESIGNER', 'TRANSPORT', 'SECURITY', 'MC_HOST');

-- CreateEnum
CREATE TYPE "VendorTier" AS ENUM ('FREE', 'PRO', 'PREMIUM');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PLANNING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ChecklistStatus" AS ENUM ('PENDING', 'SEARCHING', 'SHORTLISTED', 'FINALIZED', 'NOT_NEEDED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'MATCHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'VIEWED', 'QUOTED', 'SHORTLISTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "MenuMode" AS ENUM ('CUSTOMER_SPECIFIED', 'CATERER_PROPOSES');

-- CreateEnum
CREATE TYPE "MenuCategory" AS ENUM ('SOUP_SALAD', 'APPETIZER', 'MAIN_COURSE', 'BREAD', 'RICE_BIRYANI', 'DAL', 'DESSERT', 'BEVERAGE', 'LIVE_COUNTER', 'OTHER');

-- CreateEnum
CREATE TYPE "SpiceLevel" AS ENUM ('MILD', 'MEDIUM', 'HOT', 'VERY_HOT');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('CUSTOMER', 'VENDOR');

-- CreateEnum
CREATE TYPE "PassStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'PUSH', 'WHATSAPP');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "location" TEXT,
    "avatar_url" TEXT,
    "password_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "vendor_type" "VendorType" NOT NULL,
    "phone_business" TEXT,
    "phone_cell" TEXT,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "description" TEXT,
    "profile_photo_url" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "password_hash" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "tier" "VendorTier" NOT NULL DEFAULT 'FREE',
    "license_number" TEXT,
    "health_inspection_date" TIMESTAMP(3),
    "insurance_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorDocument" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPhoto" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorService" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VendorService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PastEvent" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "guest_count" INTEGER,
    "city" TEXT,
    "event_date" TIMESTAMP(3),
    "description" TEXT,
    "photos" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PastEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "city" TEXT NOT NULL,
    "venue" TEXT,
    "guest_count" INTEGER NOT NULL,
    "total_budget" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "total_spent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "checklist_progress" INTEGER NOT NULL DEFAULT 0,
    "status" "EventStatus" NOT NULL DEFAULT 'PLANNING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventChecklistItem" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "status" "ChecklistStatus" NOT NULL DEFAULT 'PENDING',
    "bhoj_vendor_id" TEXT,
    "external_vendor_name" TEXT,
    "external_vendor_phone" TEXT,
    "external_vendor_email" TEXT,
    "quoted_price" DECIMAL(10,2),
    "quoted_price_type" TEXT,
    "finalized_price" DECIMAL(10,2),
    "finalized_price_type" TEXT,
    "deposit_paid" BOOLEAN NOT NULL DEFAULT false,
    "deposit_amount" DECIMAL(10,2),
    "balance_due" DECIMAL(10,2),
    "balance_due_date" TIMESTAMP(3),
    "notes" TEXT,
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRequest" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "vendor_type" "VendorType" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "event_request_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "vendor_type" "VendorType" NOT NULL,
    "score" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewed_at" TIMESTAMP(3),

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "price_per_head" DECIMAL(10,2),
    "total_estimate" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "notes" TEXT,
    "tasting_offered" BOOLEAN NOT NULL DEFAULT false,
    "tasting_cost" DECIMAL(10,2),
    "tasting_date" TIMESTAMP(3),
    "tasting_location" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventMenuPreference" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "caterer_request_id" TEXT NOT NULL,
    "menu_mode" "MenuMode" NOT NULL DEFAULT 'CATERER_PROPOSES',
    "cuisine_preferences" TEXT[],
    "service_style" TEXT,
    "soup_salad_count" INTEGER,
    "appetizer_count" INTEGER,
    "main_count" INTEGER,
    "main_veg_count" INTEGER,
    "main_non_veg_count" INTEGER,
    "bread_count" INTEGER,
    "rice_biryani_count" INTEGER,
    "dal_count" INTEGER,
    "dessert_count" INTEGER,
    "live_counter_count" INTEGER,
    "beverage_count" INTEGER,
    "is_vegetarian" BOOLEAN NOT NULL DEFAULT false,
    "is_vegan" BOOLEAN NOT NULL DEFAULT false,
    "is_jain" BOOLEAN NOT NULL DEFAULT false,
    "is_halal" BOOLEAN NOT NULL DEFAULT false,
    "is_kosher" BOOLEAN NOT NULL DEFAULT false,
    "nut_free" BOOLEAN NOT NULL DEFAULT false,
    "gluten_free" BOOLEAN NOT NULL DEFAULT false,
    "dairy_free" BOOLEAN NOT NULL DEFAULT false,
    "egg_free" BOOLEAN NOT NULL DEFAULT false,
    "shellfish_free" BOOLEAN NOT NULL DEFAULT false,
    "soy_free" BOOLEAN NOT NULL DEFAULT false,
    "special_notes" TEXT,

    CONSTRAINT "EventMenuPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuPackage" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_per_head" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "min_guests" INTEGER,
    "max_guests" INTEGER,
    "cuisine_type" TEXT,
    "is_vegetarian" BOOLEAN NOT NULL DEFAULT false,
    "is_vegan" BOOLEAN NOT NULL DEFAULT false,
    "is_jain" BOOLEAN NOT NULL DEFAULT false,
    "is_halal" BOOLEAN NOT NULL DEFAULT false,
    "nut_free" BOOLEAN NOT NULL DEFAULT false,
    "gluten_free" BOOLEAN NOT NULL DEFAULT false,
    "dairy_free" BOOLEAN NOT NULL DEFAULT false,
    "includes_service" BOOLEAN NOT NULL DEFAULT false,
    "includes_setup" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "MenuCategory" NOT NULL,
    "is_vegetarian" BOOLEAN NOT NULL DEFAULT false,
    "is_vegan" BOOLEAN NOT NULL DEFAULT false,
    "is_jain" BOOLEAN NOT NULL DEFAULT false,
    "is_halal" BOOLEAN NOT NULL DEFAULT false,
    "is_kosher" BOOLEAN NOT NULL DEFAULT false,
    "contains_nuts" BOOLEAN NOT NULL DEFAULT false,
    "contains_gluten" BOOLEAN NOT NULL DEFAULT false,
    "contains_dairy" BOOLEAN NOT NULL DEFAULT false,
    "contains_eggs" BOOLEAN NOT NULL DEFAULT false,
    "contains_soy" BOOLEAN NOT NULL DEFAULT false,
    "contains_shellfish" BOOLEAN NOT NULL DEFAULT false,
    "spice_level" "SpiceLevel" NOT NULL DEFAULT 'MEDIUM',
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuPackageItem" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MenuPackageItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteMenuItem" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "menu_item_id" TEXT,
    "item_name" TEXT NOT NULL,
    "category" "MenuCategory" NOT NULL,
    "is_vegetarian" BOOLEAN NOT NULL DEFAULT false,
    "is_jain" BOOLEAN NOT NULL DEFAULT false,
    "is_halal" BOOLEAN NOT NULL DEFAULT false,
    "contains_nuts" BOOLEAN NOT NULL DEFAULT false,
    "contains_gluten" BOOLEAN NOT NULL DEFAULT false,
    "contains_dairy" BOOLEAN NOT NULL DEFAULT false,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuoteMenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiddenFeedback" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "event_request_id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "would_recommend" BOOLEAN NOT NULL,
    "communication_score" INTEGER NOT NULL,
    "professionalism_score" INTEGER NOT NULL,
    "quote_accuracy" INTEGER NOT NULL,
    "overall_experience" INTEGER NOT NULL,
    "notes" TEXT,
    "booked_offline" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HiddenFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "overall_rating" INTEGER NOT NULL,
    "food_quality_rating" INTEGER,
    "service_rating" INTEGER,
    "value_rating" INTEGER,
    "title" TEXT,
    "body" TEXT,
    "event_type" TEXT,
    "event_date" TIMESTAMP(3),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "vendor_reply" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "last_message_at" TIMESTAMP(3),
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "sender_type" "SenderType" NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorAvailability" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorMetrics" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "vendor_type" "VendorType" NOT NULL,
    "period" DATE NOT NULL,
    "lead_count" INTEGER NOT NULL DEFAULT 0,
    "quote_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "shortlist_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "avg_response_hrs" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "avg_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "booking_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "hidden_feedback_avg" DECIMAL(3,2) NOT NULL DEFAULT 0,

    CONSTRAINT "VendorMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "tier" "VendorTier" NOT NULL,
    "stripe_subscription_id" TEXT,
    "status" TEXT NOT NULL,
    "current_period_end" TIMESTAMP(3),
    "leads_this_month" INTEGER NOT NULL DEFAULT 0,
    "leads_limit" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerEventPass" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "status" "PassStatus" NOT NULL DEFAULT 'ACTIVE',
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerEventPass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerNotificationPref" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "event_type" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerNotificationPref_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorNotificationPref" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "event_type" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorNotificationPref_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_email_key" ON "Vendor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EventMenuPreference_caterer_request_id_key" ON "EventMenuPreference"("caterer_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_match_id_key" ON "Conversation"("match_id");

-- CreateIndex
CREATE UNIQUE INDEX "VendorAvailability_vendor_id_date_key" ON "VendorAvailability"("vendor_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "VendorMetrics_vendor_id_period_key" ON "VendorMetrics"("vendor_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripe_subscription_id_key" ON "Subscription"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerNotificationPref_customer_id_channel_event_type_key" ON "CustomerNotificationPref"("customer_id", "channel", "event_type");

-- CreateIndex
CREATE UNIQUE INDEX "VendorNotificationPref_vendor_id_channel_event_type_key" ON "VendorNotificationPref"("vendor_id", "channel", "event_type");

-- AddForeignKey
ALTER TABLE "VendorDocument" ADD CONSTRAINT "VendorDocument_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPhoto" ADD CONSTRAINT "VendorPhoto_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorService" ADD CONSTRAINT "VendorService_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastEvent" ADD CONSTRAINT "PastEvent_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventChecklistItem" ADD CONSTRAINT "EventChecklistItem_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRequest" ADD CONSTRAINT "EventRequest_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_event_request_id_fkey" FOREIGN KEY ("event_request_id") REFERENCES "EventRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMenuPreference" ADD CONSTRAINT "EventMenuPreference_caterer_request_id_fkey" FOREIGN KEY ("caterer_request_id") REFERENCES "EventRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuPackage" ADD CONSTRAINT "MenuPackage_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuPackageItem" ADD CONSTRAINT "MenuPackageItem_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "MenuPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuPackageItem" ADD CONSTRAINT "MenuPackageItem_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteMenuItem" ADD CONSTRAINT "QuoteMenuItem_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteMenuItem" ADD CONSTRAINT "QuoteMenuItem_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiddenFeedback" ADD CONSTRAINT "HiddenFeedback_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAvailability" ADD CONSTRAINT "VendorAvailability_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorMetrics" ADD CONSTRAINT "VendorMetrics_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerEventPass" ADD CONSTRAINT "CustomerEventPass_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerEventPass" ADD CONSTRAINT "CustomerEventPass_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerNotificationPref" ADD CONSTRAINT "CustomerNotificationPref_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorNotificationPref" ADD CONSTRAINT "VendorNotificationPref_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
