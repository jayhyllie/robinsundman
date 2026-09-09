import { TipsLinkButton } from "~/components/tips/ui";

export default function AdminHubPage() {
  return (
    <main className="tips-scope tips-bg relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="relative z-10 mx-auto max-w-lg space-y-6 tips-animate-reveal">
        <p className="tips-label">Sundman Events</p>
        <h1 className="tips-display text-5xl text-[var(--tips-rink-white)] md:text-6xl">
          Admin
        </h1>
        <p className="text-sm text-[var(--tips-muted)] md:text-base">
          Choose which experience to manage.
        </p>
        <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
          <TipsLinkButton href="/admin/quiz" size="lg">
            Quiz
          </TipsLinkButton>
          <TipsLinkButton href="/admin/tips" variant="secondary" size="lg">
            Predict
          </TipsLinkButton>
        </div>
      </div>
    </main>
  );
}
