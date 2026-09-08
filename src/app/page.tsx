import { TipsLinkButton } from "~/components/tips/ui";

export default function SundmanEventsHome() {
  return (
    <main className="tips-scope tips-bg relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="relative z-10 mx-auto max-w-lg space-y-6 tips-animate-reveal">
        <p className="tips-label">Sundman Events</p>
        <h1 className="tips-display text-5xl text-[var(--tips-rink-white)] md:text-6xl">
          Experience platforms for live events
        </h1>
        <p className="text-sm text-[var(--tips-muted)] md:text-base">
          Interactive audience experiences for clubs, arenas and sponsors.
        </p>
        <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
          <TipsLinkButton href="/quiz" size="lg">
            ÖIK Business Club Challenge
          </TipsLinkButton>
          <TipsLinkButton href="/tips/admin" variant="secondary" size="lg">
            Match Prediction
          </TipsLinkButton>
        </div>
      </div>
    </main>
  );
}
