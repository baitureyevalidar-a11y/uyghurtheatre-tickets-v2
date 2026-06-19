-- Denormalize showId onto Ticket (== booking.showId), backfilling existing rows.
-- Hand-edited from the generated migration so the NOT NULL column can be added
-- to a non-empty table: add nullable, backfill from Booking, then enforce.

-- 1. Add the column nullable so existing rows don't violate NOT NULL.
ALTER TABLE "Ticket" ADD COLUMN "showId" TEXT;

-- 2. Backfill from the owning booking's show.
UPDATE "Ticket" SET "showId" = b."showId" FROM "Booking" b
WHERE "Ticket"."bookingId" = b.id;

-- 3. Now every row has a value — enforce NOT NULL.
ALTER TABLE "Ticket" ALTER COLUMN "showId" SET NOT NULL;

-- 4. Index for ticket-by-show lookups.
CREATE INDEX "Ticket_showId_idx" ON "Ticket"("showId");

-- 5. Foreign key (Restrict: a show with issued tickets can't be hard-deleted).
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
