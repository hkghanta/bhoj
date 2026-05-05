-- AlterTable: add layout_type to SeatingChart
ALTER TABLE "SeatingChart" ADD COLUMN "layout_type" TEXT NOT NULL DEFAULT 'dining';

-- CreateTable
CREATE TABLE "SeatingRow" (
    "id" TEXT NOT NULL,
    "chart_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "section" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "row_number" INTEGER NOT NULL DEFAULT 0,
    "y_position" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "SeatingRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RowSeatAssignment" (
    "id" TEXT NOT NULL,
    "row_id" TEXT NOT NULL,
    "household_id" TEXT,
    "attendee_id" TEXT,
    "seat_number" INTEGER NOT NULL,

    CONSTRAINT "RowSeatAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeatingRow_chart_id_idx" ON "SeatingRow"("chart_id");

-- CreateIndex
CREATE INDEX "RowSeatAssignment_row_id_idx" ON "RowSeatAssignment"("row_id");

-- CreateIndex
CREATE INDEX "RowSeatAssignment_household_id_idx" ON "RowSeatAssignment"("household_id");

-- AddForeignKey
ALTER TABLE "SeatingRow" ADD CONSTRAINT "SeatingRow_chart_id_fkey" FOREIGN KEY ("chart_id") REFERENCES "SeatingChart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RowSeatAssignment" ADD CONSTRAINT "RowSeatAssignment_row_id_fkey" FOREIGN KEY ("row_id") REFERENCES "SeatingRow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
