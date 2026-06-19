import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/Container";

export default async function ShowNotFound() {
  const tShow = await getTranslations("notFound.show");
  const tEvent = await getTranslations("notFound.event");

  return (
    <Container>
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <h2 className="font-display text-3xl font-medium text-text-primary md:text-4xl">
          {tShow("title")}
        </h2>
        <p className="max-w-md text-text-secondary">{tShow("description")}</p>
        <Link
          href="/"
          className="mt-2 inline-flex items-center justify-center rounded-md bg-brand-teal px-5 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-teal-dark"
        >
          {tEvent("backHome")}
        </Link>
      </div>
    </Container>
  );
}
