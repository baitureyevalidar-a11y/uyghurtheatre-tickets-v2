// NOTE: KZ/UG translations are placeholder — replace with theater-reviewed translations before production.
import { PrismaClient, UserRole, ShowStatus, Locale } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

type SeedEvent = {
  slug: string;
  titleRu: string;
  titleKz: string;
  titleUg: string;
  descriptionRu: string;
  descriptionKz: string;
  descriptionUg: string;
  durationMin: number;
  ageRating: string;
  genre: string;
  posterUrl: string;
  coverUrl: string;
  show: {
    daysFromNow: number;
    hour: number;
    minute: number;
    pricePremium: number;
    priceStandard: number;
    priceEconomy: number;
    priceBalcony: number;
  };
};

const STANDARD_PRICES = {
  pricePremium: 4000,
  priceStandard: 3500,
  priceEconomy: 3000,
  priceBalcony: 2500,
};

const EVENTS: SeedEvent[] = [
  {
    slug: "test-spectakl",
    titleRu: "Тестовый спектакль",
    titleKz: "Тест спектакль",
    titleUg: "Тест спектакли",
    descriptionRu: "Тестовый спектакль для проверки системы. Заглушка описания.",
    descriptionKz: "Жүйені тексеру үшін тест спектакль.",
    descriptionUg: "Системини тәкшүрүш үчүн тест спектакли.",
    durationMin: 120,
    ageRating: "12+",
    genre: "Музыкальная комедия",
    posterUrl: "https://picsum.photos/seed/test-spectakl/600/900",
    coverUrl: "https://picsum.photos/seed/test-spectakl-cover/1600/600",
    show: { daysFromNow: 14, hour: 19, minute: 0, ...STANDARD_PRICES },
  },
  {
    slug: "nazugum",
    titleRu: "Назугум",
    titleKz: "Назугум",
    titleUg: "Назугум",
    descriptionRu:
      "Классическая уйгурская опера о трагической судьбе девушки Назугум, борющейся за свою свободу и любовь. Постановка по одноимённой поэме Назима Хикмата.",
    descriptionKz:
      "Назугум қызының тағдыры туралы классикалық ұйғыр операсы. Сүйіспеншілік пен бостандық үшін күрес туралы трагедия.",
    descriptionUg:
      "Назугум қизниң тәғдири һәққидә классик уйғур операси. Муһәббәт вә әркинлик үчүн күрәш һәққидә трагедийә.",
    durationMin: 150,
    ageRating: "12+",
    genre: "Опера",
    posterUrl: "https://picsum.photos/seed/nazugum/600/900",
    coverUrl: "https://picsum.photos/seed/nazugum-cover/1600/600",
    show: { daysFromNow: 7, hour: 19, minute: 0, ...STANDARD_PRICES },
  },
  {
    slug: "anarkhan",
    titleRu: "Анархан",
    titleKz: "Анархан",
    titleUg: "Анархан",
    descriptionRu:
      "Лирическая опера о любви и долге, поставленная по мотивам уйгурского народного эпоса. Премьера сезона.",
    descriptionKz:
      "Ұйғыр халық эпосының желісі бойынша қойылған сүйіспеншілік пен парыз туралы лирикалық опера.",
    descriptionUg:
      "Уйғур хәлқ дастани бойичә қоюлған муһәббәт вә бурч һәққидә лирик опера.",
    durationMin: 180,
    ageRating: "12+",
    genre: "Опера",
    posterUrl: "https://picsum.photos/seed/anarkhan/600/900",
    coverUrl: "https://picsum.photos/seed/anarkhan-cover/1600/600",
    show: { daysFromNow: 21, hour: 19, minute: 0, ...STANDARD_PRICES },
  },
  {
    slug: "chin-tumur-batyr",
    titleRu: "Чин Тумур батыр",
    titleKz: "Чин Тұмыр батыр",
    titleUg: "Чин Тумур батур",
    descriptionRu:
      "Героическая музыкальная драма о подвигах легендарного уйгурского богатыря. Семейная постановка с участием детского ансамбля.",
    descriptionKz:
      "Аңызға айналған ұйғыр батырының ерліктері туралы қаһармандық музыкалық драма.",
    descriptionUg:
      "Әпсанивий уйғур батурниң қәһриманлиқлири һәққидә қәһриманлиқ музыкилиқ драма.",
    durationMin: 140,
    ageRating: "6+",
    genre: "Музыкальная драма",
    posterUrl: "https://picsum.photos/seed/chintumur/600/900",
    coverUrl: "https://picsum.photos/seed/chintumur-cover/1600/600",
    show: { daysFromNow: 10, hour: 18, minute: 0, ...STANDARD_PRICES },
  },
  {
    slug: "shypaq-shal",
    titleRu: "Шыпақ шал",
    titleKz: "Шыпақ шал",
    titleUg: "Шипақ чал",
    descriptionRu:
      "Музыкальная комедия о старике-знахаре, который попадает в современный город и оказывается в центре нелепых ситуаций. Спектакль идёт на уйгурском языке с переводом на русский.",
    descriptionKz:
      "Заманауи қалаға тап болған қарт шипагер туралы көңілді музыкалық комедия.",
    descriptionUg:
      "Заманивий шәһәргә келип қалған тевип бовай һәққидә күлкилик музыкилиқ комедия.",
    durationMin: 120,
    ageRating: "12+",
    genre: "Музыкальная комедия",
    posterUrl: "https://picsum.photos/seed/shypaqshal/600/900",
    coverUrl: "https://picsum.photos/seed/shypaqshal-cover/1600/600",
    show: {
      daysFromNow: 5,
      hour: 19,
      minute: 30,
      pricePremium: 3500,
      priceStandard: 3000,
      priceEconomy: 2500,
      priceBalcony: 2000,
    },
  },
];

async function main() {
  // ─── Admin user ───
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { phone: "+77001234567" },
    update: {},
    create: {
      phone: "+77001234567",
      name: "Test Admin",
      role: UserRole.ADMIN,
      passwordHash: adminPasswordHash,
      preferredLocale: Locale.ru,
    },
  });

  // ─── Cashier user ───
  const cashierPasswordHash = await bcrypt.hash("kassa123", 10);
  const cashier = await prisma.user.upsert({
    where: { phone: "+77001234568" },
    update: {},
    create: {
      phone: "+77001234568",
      name: "Test Cashier",
      role: UserRole.CASHIER,
      passwordHash: cashierPasswordHash,
      preferredLocale: Locale.ru,
    },
  });

  // ─── Events + one show each ───
  // Idempotent: events upsert by slug (create AND update so seed edits propagate),
  // shows deleted then recreated per event (one show per event).
  const seeded: { slug: string; startsAt: Date; genre: string }[] = [];

  for (const e of EVENTS) {
    const { show: showSpec, ...eventData } = e;

    const eventRecord = await prisma.event.upsert({
      where: { slug: e.slug },
      create: { ...eventData, isActive: true },
      update: { ...eventData, isActive: true },
    });

    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + showSpec.daysFromNow);
    startsAt.setHours(showSpec.hour, showSpec.minute, 0, 0);

    // Re-seeding is idempotent: tear down this event's show FK graph in
    // child→parent order. Several relations are onDelete: Restrict
    // (Payment→Booking, Booking→Show), so children must be removed first.
    // Ticket→Booking and ShowSeat→Show are Cascade, but we delete them
    // explicitly to keep the order obvious and avoid relying on cascade timing.
    // AuditLog has no FK to Booking/Show (entityId is a plain string) — nothing
    // to clean there. All deletes are scoped to this event's showIds/bookingIds.
    const oldShows = await prisma.show.findMany({
      where: { eventId: eventRecord.id },
      select: { id: true },
    });
    if (oldShows.length) {
      const showIds = oldShows.map((s) => s.id);
      const oldBookings = await prisma.booking.findMany({
        where: { showId: { in: showIds } },
        select: { id: true },
      });
      const bookingIds = oldBookings.map((b) => b.id);

      if (bookingIds.length) {
        // Children of Booking.
        await prisma.payment.deleteMany({
          where: { bookingId: { in: bookingIds } },
        });
        await prisma.ticket.deleteMany({
          where: { bookingId: { in: bookingIds } },
        });
      }
      // Children of Show.
      await prisma.showSeat.deleteMany({ where: { showId: { in: showIds } } });
      // Bookings (child of Show, Restrict) before the shows themselves.
      await prisma.booking.deleteMany({ where: { showId: { in: showIds } } });
    }
    await prisma.show.deleteMany({ where: { eventId: eventRecord.id } });
    const showRecord = await prisma.show.create({
      data: {
        eventId: eventRecord.id,
        startsAt,
        status: ShowStatus.ON_SALE,
        pricePremium: showSpec.pricePremium,
        priceStandard: showSpec.priceStandard,
        priceEconomy: showSpec.priceEconomy,
        priceBalcony: showSpec.priceBalcony,
      },
    });

    // shypaq-shal carries seeded sales so admin "locked show" + disabled-delete
    // states are exercisable end-to-end.
    if (e.slug === "shypaq-shal") {
      const soldSeats = [
        { row: 1, seat: 1 },
        { row: 1, seat: 2 },
      ];
      const subtotal = soldSeats.length * showSpec.pricePremium;
      await prisma.booking.create({
        data: {
          showId: showRecord.id,
          customerName: "Тестовый покупатель",
          customerEmail: "buyer@example.com",
          customerPhone: "+77009998877",
          subtotal,
          total: subtotal,
          status: "PAID",
          source: "WEB",
          locale: Locale.ru,
          tickets: {
            create: soldSeats.map((s, i) => ({
              showId: showRecord.id,
              zoneId: "parter",
              zoneName: "Партер",
              row: s.row,
              seat: s.seat,
              tier: "premium",
              price: showSpec.pricePremium,
              ticketCode: `UYG-SEED-${String(i + 1).padStart(4, "0")}`,
              qrPayload: `seed-qr-shypaq-${i + 1}`,
              status: "VALID",
            })),
          },
        },
      });
    }

    seeded.push({
      slug: eventRecord.slug,
      startsAt: showRecord.startsAt,
      genre: eventRecord.genre ?? "—",
    });
  }

  console.log("✓ Seeded:");
  console.log(`  Admin:    ${admin.phone} / admin123`);
  console.log(`  Cashier:  ${cashier.phone} / kassa123`);
  console.log(`  Events:   ${seeded.length}`);
  for (const s of seeded) {
    console.log(`    - ${s.slug.padEnd(18)} ${s.startsAt.toISOString()}  (${s.genre})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
