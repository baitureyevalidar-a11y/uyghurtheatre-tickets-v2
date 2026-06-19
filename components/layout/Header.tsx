import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ShoppingCart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { readSessionId } from "@/lib/session";
import { hasActivePendingBooking } from "@/lib/cart-lookup";
import { Container } from "./Container";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { CartDot } from "./CartDot";

export async function Header() {
  const t = await getTranslations("header");
  const sessionId = await readSessionId();
  const hasPending = await hasActivePendingBooking(sessionId);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/[0.86] backdrop-blur-[14px]">
      <Container className="flex items-center gap-4 py-3 md:gap-6">
        {/* Logo — brand mark, does NOT change with locale */}
        <Link
          href="/"
          aria-label={t("logoAlt")}
          className="flex shrink-0 items-center"
        >
          <Image
            src="/theater-icon.png"
            alt={t("logoAlt")}
            width={80}
            height={80}
            priority
            className="h-16 w-16 object-contain md:h-20 md:w-20"
          />
        </Link>

        <div className="ms-auto flex items-center gap-2 md:gap-4">
          {/* Cart */}
          <Link
            href="/cart"
            aria-label={t("cart")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-soft transition-colors hover:text-garnet"
          >
            <span className="relative">
              <ShoppingCart className="h-[22px] w-[22px]" aria-hidden />
              <CartDot hasPending={hasPending} />
            </span>
          </Link>

          <LocaleSwitcher />

          {/* Optional desktop CTA → afisha */}
          <Link
            href="/"
            className="hidden rounded-xl bg-garnet px-4 py-2.5 text-sm font-semibold text-white shadow-cta transition-colors hover:bg-garnet-dark lg:inline-flex"
          >
            {t("buyTicket")}
          </Link>
        </div>
      </Container>
    </header>
  );
}
