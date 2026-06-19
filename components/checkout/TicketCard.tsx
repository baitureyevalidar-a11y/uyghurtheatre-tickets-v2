import { getTranslations } from "next-intl/server";
import { generateQrImageDataUrl } from "@/lib/tickets";
import { formatPrice, type AppLocale } from "@/lib/format";

type TicketCardProps = {
  ticket: {
    ticketCode: string;
    qrPayload: string;
    zoneName: string;
    row: number;
    seat: number;
    price: number;
  };
  locale: AppLocale;
};

export async function TicketCard({ ticket, locale }: TicketCardProps) {
  const t = await getTranslations("checkout.success");
  const qrDataUrl = await generateQrImageDataUrl(ticket.qrPayload);

  return (
    <article className="flex flex-col gap-4 rounded-lg border border-border-default bg-bg-surface p-5 sm:flex-row sm:items-center">
      <div className="shrink-0 rounded-md bg-white p-2">
        {/* QR is an inline data URL — next/image would force a remote-loader; plain <img> is correct here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt={ticket.ticketCode}
          width={140}
          height={140}
          className="block h-[140px] w-[140px]"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="text-text-primary">
          <div className="font-display text-lg font-medium">
            {ticket.zoneName}
          </div>
          <div className="text-sm text-text-secondary">
            {t("rowSeat", { row: ticket.row, seat: ticket.seat })}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="font-mono text-sm tracking-wider text-text-tertiary">
            {ticket.ticketCode}
          </div>
          <div className="text-sm font-medium text-brand-teal">
            {formatPrice(ticket.price, locale)}
          </div>
        </div>
      </div>
    </article>
  );
}
