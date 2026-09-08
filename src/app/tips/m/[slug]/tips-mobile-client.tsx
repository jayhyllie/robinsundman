"use client";

import { Check, Share2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { TipsScope } from "~/components/tips/tips-scope";
import {
  CountdownBlocks,
  QuickPickChips,
  ScoreStepper,
  SponsorFooterLockup,
  SponsorRibbon,
  TeamCrest,
  TipsBadge,
  TipsButton,
  TipsGlassCard,
  TipsInput,
} from "~/components/tips/ui";
import { api } from "~/trpc/react";

type Screen = "landing" | "form" | "success" | "closed";

type StoredPrediction = {
  playerName: string;
  homeGoals: number;
  awayGoals: number;
};

function storageKey(slug: string) {
  return `tips-prediction-${slug}`;
}

export function TipsMobileClient({ slug }: { slug: string }) {
  const matchQuery = api.tips.matchBySlug.useQuery(
    { slug },
    { refetchInterval: 15_000 },
  );
  const statsQuery = api.tips.publicStats.useQuery(
    { slug },
    { refetchInterval: 5_000 },
  );
  const submit = api.tips.submitPrediction.useMutation();

  const [screen, setScreen] = useState<Screen>("landing");
  const [playerName, setPlayerName] = useState("");
  const [email, setEmail] = useState("");
  const [homeGoals, setHomeGoals] = useState(3);
  const [awayGoals, setAwayGoals] = useState(2);
  const [stored, setStored] = useState<StoredPrediction | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(slug));
      if (raw) {
        const parsed = JSON.parse(raw) as StoredPrediction;
        setStored(parsed);
        setScreen("success");
      }
    } catch {
      /* ignore */
    }
  }, [slug]);

  const match = matchQuery.data;
  const status = statsQuery.data?.status ?? match?.status;
  const isClosed =
    status === "CLOSED" ||
    status === "RESULT_REGISTERED" ||
    status === "WINNER_PICKED";

  useEffect(() => {
    if (isClosed && !stored) setScreen("closed");
  }, [isClosed, stored]);

  const count = statsQuery.data?.predictionCount ?? match?.predictionCount ?? 0;

  const title = useMemo(() => {
    if (!match) return "";
    return `${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`;
  }, [match]);

  async function onSubmit(marketingConsent: boolean) {
    if (!match) return;
    try {
      await submit.mutateAsync({
        slug,
        playerName,
        email,
        marketingConsent,
        homeGoals,
        awayGoals,
      });
      const payload: StoredPrediction = {
        playerName,
        homeGoals,
        awayGoals,
      };
      localStorage.setItem(storageKey(slug), JSON.stringify(payload));
      setStored(payload);
      setConsentOpen(false);
      setScreen("success");
      void matchQuery.refetch();
      void statsQuery.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte spara tipset");
    }
  }

  const canOpenConsent =
    playerName.trim().length >= 2 &&
    email.includes("@") &&
    email.includes(".") &&
    !submit.isPending;

  if (matchQuery.isLoading) {
    return (
      <TipsScope className="flex items-center justify-center">
        <p className="tips-label">Loading…</p>
      </TipsScope>
    );
  }

  if (!match) {
    return (
      <TipsScope className="flex items-center justify-center p-6">
        <TipsGlassCard className="max-w-sm text-center">
          <p className="tips-display text-3xl">Match not found</p>
        </TipsGlassCard>
      </TipsScope>
    );
  }

  return (
    <TipsScope className="mx-auto flex min-h-svh max-w-md flex-col px-4 pb-10 pt-5">
      {match.sponsor ? (
        <SponsorRibbon
          name={match.sponsor.name}
          logoUrl={match.sponsor.logoUrl}
          campaignText={match.sponsor.campaignText}
          primaryColor={match.sponsor.primaryColor}
          className="mb-5"
        />
      ) : null}

      {screen === "landing" ? (
        <div className="flex flex-1 flex-col gap-6 tips-animate-reveal">
          <div>
            <p className="tips-label mb-2">Tonight&apos;s Prediction Challenge</p>
            <h1 className="tips-display text-5xl leading-none text-[--tips-rink-white]">
              Predict
              <br />
              the Final
              <br />
              <span className="tips-ice-text">Score</span>
            </h1>
          </div>

          <TipsGlassCard>
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col items-center gap-2">
                <TeamCrest
                  name={match.homeTeam.name}
                  logoUrl={match.homeTeam.logoUrl}
                  size="lg"
                />
                <span className="text-xs font-bold tracking-wide uppercase">
                  {match.homeTeam.shortName}
                </span>
              </div>
              <span className="tips-display text-2xl text-[--tips-muted]">
                VS
              </span>
              <div className="flex flex-col items-center gap-2">
                <TeamCrest
                  name={match.awayTeam.name}
                  logoUrl={match.awayTeam.logoUrl}
                  size="lg"
                />
                <span className="text-xs font-bold tracking-wide uppercase">
                  {match.awayTeam.shortName}
                </span>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-[--tips-muted]">
              {title}
            </p>
          </TipsGlassCard>

          <div>
            <p className="tips-label mb-2">Puck drop</p>
            <CountdownBlocks target={match.puckDropAt} compact />
          </div>

          <div className="flex items-center justify-between">
            <TipsBadge status="LIVE" liveDot>
              LIVE
            </TipsBadge>
            <p className="text-sm text-[--tips-muted]">
              <span className="tips-ice-text font-bold tabular-nums">
                {count.toLocaleString("sv-SE")}
              </span>{" "}
              fans tipped
            </p>
          </div>

          <TipsButton
            size="lg"
            className="mt-auto w-full"
            onClick={() => setScreen("form")}
            disabled={isClosed}
          >
            Predict Result
          </TipsButton>
        </div>
      ) : null}

      {screen === "form" ? (
        <div className="flex flex-1 flex-col gap-5 tips-animate-reveal">
          <button
            type="button"
            className="tips-label self-start text-[--tips-muted]!"
            onClick={() => setScreen("landing")}
          >
            ← Back
          </button>
          <h1 className="tips-display text-4xl">Your tip</h1>

          <TipsInput
            label="Name"
            placeholder="Förnamn Efternamn"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <TipsInput
            label="E-post"
            placeholder="namn@foretag.se"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TipsGlassCard className="text-center">
            <p className="tips-label mb-4 text-center">Final Score</p>
            <div className="flex items-center justify-center gap-3">
              <ScoreStepper
                label={match.homeTeam.shortName}
                value={homeGoals}
                onChange={setHomeGoals}
              />
              <span className="tips-display text-3xl text-[--tips-muted]">
                –
              </span>
              <ScoreStepper
                label={match.awayTeam.shortName}
                value={awayGoals}
                onChange={setAwayGoals}
              />
            </div>
            <p className="tips-label mt-6 mb-2 text-center text-[--tips-muted]!">
              Quick picks
            </p>
            <QuickPickChips
              selected={{ home: homeGoals, away: awayGoals }}
              onSelect={(h, a) => {
                setHomeGoals(h);
                setAwayGoals(a);
              }}
              className="justify-center"
            />
          </TipsGlassCard>

          <TipsButton
            size="lg"
            className="mt-auto w-full"
            disabled={!canOpenConsent}
            onClick={() => setConsentOpen(true)}
          >
            Submit Prediction
          </TipsButton>
        </div>
      ) : null}

      {consentOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="marketing-consent-title"
        >
          <TipsGlassCard className="w-full max-w-md tips-animate-reveal space-y-4">
            <p className="tips-label">Nyhetsbrev</p>
            <h2
              id="marketing-consent-title"
              className="tips-display text-3xl leading-none"
            >
              Vill du få erbjudanden?
            </h2>
            <p className="text-sm text-[--tips-muted]">
              Godkänner du att vi använder din e-postadress för framtida
              nyhetsbrev och erbjudanden från klubben och partners? Du kan
              tippa oavsett vad du svarar.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <TipsButton
                size="lg"
                className="w-full"
                disabled={submit.isPending}
                onClick={() => void onSubmit(true)}
              >
                {submit.isPending ? "Skickar…" : "Ja, jag godkänner"}
              </TipsButton>
              <TipsButton
                size="lg"
                variant="secondary"
                className="w-full"
                disabled={submit.isPending}
                onClick={() => void onSubmit(false)}
              >
                Nej tack, bara tippa
              </TipsButton>
              <TipsButton
                variant="tertiary"
                className="w-full"
                disabled={submit.isPending}
                onClick={() => setConsentOpen(false)}
              >
                Avbryt
              </TipsButton>
            </div>
          </TipsGlassCard>
        </div>
      ) : null}

      {screen === "success" && stored ? (
        <div className="flex flex-1 flex-col items-center gap-6 text-center tips-animate-reveal">
          <div className="flex size-16 items-center justify-center rounded-full bg-[rgba(57,255,20,0.15)]">
            <Check className="size-8 text-[--tips-ice-highlight]" />
          </div>
          <div>
            <p className="tips-label mb-2">You&apos;re in</p>
            <h1 className="tips-display text-5xl">Prediction locked</h1>
          </div>
          <TipsGlassCard className="w-full">
            <p className="text-sm text-[--tips-muted]">{stored.playerName}</p>
            <p className="tips-display mt-2 text-6xl tips-ice-text">
              {stored.homeGoals}–{stored.awayGoals}
            </p>
            <p className="mt-2 text-sm text-[--tips-muted]">{title}</p>
          </TipsGlassCard>
          {match.sponsor ? (
            <SponsorFooterLockup
              name={match.sponsor.name}
              logoUrl={match.sponsor.logoUrl}
            />
          ) : null}
          <TipsButton
            variant="secondary"
            className="w-full"
            onClick={() => {
              void navigator.share?.({
                title: "ÖIK Prediction",
                text: `Jag tippade ${stored.homeGoals}–${stored.awayGoals}!`,
                url: window.location.href,
              }).catch(() => {
                void navigator.clipboard.writeText(window.location.href);
                toast.success("Länk kopierad");
              });
            }}
          >
            <Share2 className="size-4" /> Share
          </TipsButton>
        </div>
      ) : null}

      {screen === "closed" ? (
        <div className="flex flex-1 flex-col gap-6 tips-animate-reveal">
          <div className="flex size-14 items-center justify-center rounded-full bg-white/10">
            <X className="size-7 text-[--tips-muted]" />
          </div>
          <div>
            <p className="tips-label mb-2">Closed</p>
            <h1 className="tips-display text-5xl">Tipping is now closed</h1>
          </div>
          <TipsGlassCard>
            <div className="flex items-center justify-center gap-4">
              <TeamCrest
                name={match.homeTeam.name}
                logoUrl={match.homeTeam.logoUrl}
                size="md"
              />
              <span className="tips-display text-4xl tabular-nums">
                {statsQuery.data?.homeScore ?? match.homeScore ?? "–"}
                <span className="text-[--tips-muted]"> : </span>
                {statsQuery.data?.awayScore ?? match.awayScore ?? "–"}
              </span>
              <TeamCrest
                name={match.awayTeam.name}
                logoUrl={match.awayTeam.logoUrl}
                size="md"
              />
            </div>
            <p className="mt-4 text-center text-sm text-[--tips-muted]">
              {count.toLocaleString("sv-SE")} predictions submitted
            </p>
          </TipsGlassCard>
          <TipsButton variant="secondary" className="mt-auto w-full" disabled>
            Next home game soon
          </TipsButton>
        </div>
      ) : null}
    </TipsScope>
  );
}
