import { useI18n } from "~/components/providers/i18n-provider";
import { TipsLinkButton } from "~/components/tips/ui";

export default function AdminHubPage() {
  const { t } = useI18n();
  return (
    <main className="tips-scope tips-bg relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="relative z-10 mx-auto max-w-lg space-y-6 tips-animate-reveal">
        <p className="tips-label">Sundman Events</p>
        <h1 className="tips-display text-5xl text-[--tips-rink-white] md:text-6xl">
          Admin
        </h1>
        <p className="text-sm text-[--tips-muted] md:text-base">
          {t("adminChooseExperience")}
        </p>
        <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
          <TipsLinkButton href="/admin/quiz" size="lg">
            {t("adminQuiz")}
          </TipsLinkButton>
          <TipsLinkButton href="/admin/tips" variant="secondary" size="lg">
            {t("adminPredict")}
          </TipsLinkButton>
        </div>
      </div>
    </main>
  );
}
