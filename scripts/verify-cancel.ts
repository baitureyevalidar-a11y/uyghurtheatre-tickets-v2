// One-off: exercise the cancel-show cascade against the seeded shypaq-shal show
// inside a transaction that ROLLS BACK (throws at the end) — verifies query
// validity + resulting state without persisting anything. Delete after.
import {
  PrismaClient,
  ShowStatus,
  BookingStatus,
  TicketStatus,
  PaymentStatus,
} from "@prisma/client";

const prisma = new PrismaClient();
class Rollback extends Error {}

async function main() {
  const show = await prisma.show.findFirst({
    where: { event: { slug: "shypaq-shal" } },
  });
  if (!show) throw new Error("shypaq-shal show not found — run the seed first");
  const showId = show.id;

  let captured: Record<string, unknown> = {};
  try {
    await prisma.$transaction(async (tx) => {
      const full = await tx.show.findUnique({
        where: { id: showId },
        include: {
          event: { select: { id: true, slug: true } },
          bookings: { include: { tickets: true, payments: true } },
        },
      });
      if (!full) throw new Error("missing");

      await tx.show.update({
        where: { id: showId },
        data: { status: ShowStatus.CANCELLED },
      });

      const now = new Date();
      let cancelledBookings = 0;
      let refundedTickets = 0;
      let refundedAmount = 0;
      for (const b of full.bookings) {
        if (b.status === BookingStatus.PAID) {
          cancelledBookings += 1;
          refundedTickets += b.tickets.length;
          refundedAmount += b.tickets.reduce((s, t) => s + t.price, 0);
          await tx.booking.update({
            where: { id: b.id },
            data: { status: BookingStatus.REFUNDED },
          });
          await tx.ticket.updateMany({
            where: { bookingId: b.id },
            data: { status: TicketStatus.REFUNDED },
          });
          await tx.payment.updateMany({
            where: { bookingId: b.id },
            data: {
              status: PaymentStatus.REFUNDED,
              refundedAt: now,
              refundReason: `Show cancelled by admin: ${showId}`,
            },
          });
        } else if (b.status === BookingStatus.PENDING) {
          await tx.booking.update({
            where: { id: b.id },
            data: { status: BookingStatus.EXPIRED },
          });
        }
      }
      await tx.showSeat.deleteMany({ where: { showId } });
      await tx.auditLog.create({
        data: {
          userId: "verify-script",
          action: "CANCEL_SHOW",
          entityType: "Show",
          entityId: showId,
          details: { showId, cancelledBookings, refundedTickets, refundedAmount },
        },
      });

      // Read back the uncommitted state to assert the cascade landed.
      const after = await tx.show.findUnique({
        where: { id: showId },
        include: { bookings: { include: { tickets: true, payments: true } } },
      });
      const seatsLeft = await tx.showSeat.count({ where: { showId } });
      const audit = await tx.auditLog.count({
        where: { entityId: showId, action: "CANCEL_SHOW", userId: "verify-script" },
      });

      captured = {
        showStatus: after?.status,
        bookingStatuses: after?.bookings.map((b) => b.status),
        ticketStatuses: after?.bookings.flatMap((b) => b.tickets.map((t) => t.status)),
        paymentStatuses: after?.bookings.flatMap((b) => b.payments.map((p) => p.status)),
        seatsLeft,
        auditRows: audit,
        summary: { cancelledBookings, refundedTickets, refundedAmount },
      };

      throw new Rollback();
    });
  } catch (e) {
    if (!(e instanceof Rollback)) throw e;
  }

  console.log("cascade result (rolled back, not persisted):");
  console.log(JSON.stringify(captured, null, 2));

  // Confirm rollback: DB untouched.
  const persisted = await prisma.show.findUnique({ where: { id: showId } });
  console.log("\npost-rollback show.status (should be ON_SALE):", persisted?.status);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
