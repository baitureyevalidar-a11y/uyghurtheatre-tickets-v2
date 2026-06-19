import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Container } from "./Container";

// Brand glyphs — lucide-react (v1.17) no longer ships social icons, so these
// are inline. `currentColor` lets them inherit hover colour.
type IconProps = { className?: string };

function InstagramIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function FacebookIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M14 9h3l.4-3H14V4.3c0-.9.3-1.5 1.6-1.5H18V.2C17.6.1 16.4 0 15.3 0 12.8 0 11 1.5 11 4.1V6H8v3h3v9h3V9Z" />
    </svg>
  );
}
function YoutubeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23 7.5a3 3 0 0 0-2.1-2.1C19 5 12 5 12 5s-7 0-8.9.4A3 3 0 0 0 1 7.5 31 31 0 0 0 .6 12 31 31 0 0 0 1 16.5a3 3 0 0 0 2.1 2.1C5 19 12 19 12 19s7 0 8.9-.4A3 3 0 0 0 23 16.5 31 31 0 0 0 23.4 12 31 31 0 0 0 23 7.5ZM9.8 15.3V8.7l5.7 3.3-5.7 3.3Z" />
    </svg>
  );
}
function VkIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.8 16.3c-5 0-8.1-3.5-8.2-9.2h2.6c.1 4.2 2 6 3.5 6.3V7h2.4v3.7c1.4-.2 2.9-1.8 3.4-3.6h2.4c-.4 2.2-1.8 3.7-2.8 4.3 1 .6 2.6 2 3.2 4.3h-2.6c-.5-1.4-1.8-2.6-3.6-2.7v2.7h-.7Z" />
    </svg>
  );
}
function TiktokIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.5 3c.3 2 1.6 3.7 3.5 4.1v2.5c-1.3 0-2.5-.4-3.5-1v5.7a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.6a3.1 3.1 0 1 0 2.2 3V3h2.5Z" />
    </svg>
  );
}
function WhatsappIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.4 0-1 .1-3.2-.9-2.7-1.2-4.4-4-4.5-4.2-.1-.2-1.1-1.4-1.1-2.7s.7-1.9.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.2.1.4.1.6-.1l.7-.8c.2-.2.3-.2.6-.1l1.8.9c.3.1.5.2.5.4.1.1.1.8-.1 1.4Z" />
    </svg>
  );
}

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com/uyghurtheatrekz", Icon: InstagramIcon },
  { label: "Facebook", href: "https://facebook.com/uyghurtheatrekz", Icon: FacebookIcon },
  { label: "YouTube", href: "https://youtube.com/@uyghurtheatrekz", Icon: YoutubeIcon },
  { label: "VK", href: "https://vk.com/uyghurtheatrekz", Icon: VkIcon },
  { label: "TikTok", href: "https://tiktok.com/@uyghurtheatrekz", Icon: TiktokIcon },
  { label: "WhatsApp", href: "https://wa.me/77071011178", Icon: WhatsappIcon },
];

const BOX_OFFICE_DISPLAY = "+7 (727) 272 82 76";
const BOX_OFFICE_TEL = "+77272728276";
const PHONE_DISPLAY = "+7 (727) 272 59 33";
const PHONE_TEL = "+77272725933";

export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="mt-auto bg-night text-paper">
      <Container className="py-12 md:py-16">
        {/* Pomegranate motif divider — garnet→gold-soft for the dark bg */}
        <div className="mx-auto mb-10 h-0.5 w-[46px] rounded-sm bg-gradient-to-r from-garnet to-gold-soft" />

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Col 1 — brand */}
          <div>
            <div className="flex items-center gap-4">
              <Image
                src="/theater-icon.png"
                alt={t("brand.name")}
                width={80}
                height={80}
                className="h-20 w-20 shrink-0 object-contain"
              />
              <div>
                <div className="font-serif text-3xl leading-tight text-paper">
                  {t("brand.name")}
                </div>
                <p className="mt-1 text-sm text-paper/60">{t("brand.tagline")}</p>
              </div>
            </div>
          </div>

          {/* Col 2 — contacts */}
          <div>
            <div className="eyebrow mb-4 text-gold-soft">{t("contactsLabel")}</div>
            <ul className="space-y-3">
              <li>
                <div className="text-[11px] uppercase tracking-wide text-paper/60">
                  {t("contacts.boxOffice")}
                </div>
                <a
                  href={`tel:${BOX_OFFICE_TEL}`}
                  className="text-paper transition-colors hover:underline"
                >
                  {BOX_OFFICE_DISPLAY}
                </a>
              </li>
              <li>
                <div className="text-[11px] uppercase tracking-wide text-paper/60">
                  {t("contacts.phone")}
                </div>
                <a
                  href={`tel:${PHONE_TEL}`}
                  className="text-paper transition-colors hover:underline"
                >
                  {PHONE_DISPLAY}
                </a>
              </li>
              <li>
                <div className="text-[11px] uppercase tracking-wide text-paper/60">
                  {t("contacts.email")}
                </div>
                <a
                  href={`mailto:${t("email")}`}
                  className="text-paper transition-colors hover:underline"
                >
                  {t("email")}
                </a>
              </li>
              <li>
                <div className="text-[11px] uppercase tracking-wide text-paper/60">
                  {t("contacts.address")}
                </div>
                <span className="text-paper">{t("contacts.addressValue")}</span>
              </li>
            </ul>
          </div>

          {/* Col 3 — socials */}
          <div>
            <div className="eyebrow mb-4 text-gold-soft">{t("followUs")}</div>
            <div className="flex flex-wrap gap-2.5">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-paper/20 text-paper transition-colors hover:border-gold hover:text-gold"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-12 flex flex-col gap-2 border-t border-paper/15 pt-6 text-xs text-paper/70 md:flex-row md:items-center md:justify-between">
          <span className="max-w-2xl">{t("officialName")}</span>
          <span className="shrink-0">© 2026 · {t("rights")}</span>
        </div>
      </Container>
    </footer>
  );
}
