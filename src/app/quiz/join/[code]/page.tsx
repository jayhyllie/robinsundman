"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, Info, Plus, Trophy, Users } from "lucide-react";
import { toast } from "sonner";

import { CompanyLeaderboard } from "~/components/quiz/leaderboard";
import { MobileShell } from "~/components/layout/shell";
import { localized, useI18n } from "~/components/providers/i18n-provider";
import { useBranding } from "~/components/providers/branding-provider";
import { AppTitle } from "~/components/ui/logo";
import { TipsButton, TipsGlassCard } from "~/components/tips/ui";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function InfoPill({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="tips-glass flex items-center gap-1.5 rounded-[--tips-radius-pill] px-3 py-1.5 text-[11px] font-extrabold tracking-[0.14em] text-[--tips-rink-white] uppercase">
      <Icon className="h-3.5 w-3.5 text-[--tips-club-lime]" />
      {children}
    </span>
  );
}

type ComboboxOption = {
  value: string;
  label: string;
};

function JoinCombobox({
  label,
  value,
  onChange,
  onSelect,
  options,
  placeholder,
  addNewLabel,
  showAddNew,
  onConfirmNew,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (option: ComboboxOption) => void;
  options: ComboboxOption[];
  placeholder: string;
  addNewLabel?: string;
  showAddNew?: boolean;
  onConfirmNew?: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const query = value.trim().toLowerCase();
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query))
    : options;

  return (
    <div className="space-y-2">
      <Label className="tips-label normal-case! tracking-[0.18em]">{label}</Label>
      <div className="relative" ref={containerRef}>
        <div className="relative">
          <Input
            value={value}
            disabled={disabled}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="pr-9"
          />
          <button
            type="button"
            disabled={disabled}
            aria-label="Show options"
            className="absolute top-0 right-0 flex h-full w-9 items-center justify-center text-[--tips-muted] hover:text-[--tips-rink-white] disabled:opacity-50"
            onClick={() => setOpen((prev) => !prev)}
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
            />
          </button>
        </div>

        {open && !disabled && (
          <div className="bg-black rounded-lg absolute z-50 mt-1 w-full overflow-hidden p-0 shadow-lg">
            {filtered.length > 0 ? (
              <ul className="max-h-48 overflow-y-auto py-1">
                {filtered.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      className="w-full px-3 py-2.5 text-left text-sm hover:bg-[--tips-glass-active]"
                      onMouseDown={() => {
                        onSelect(option);
                        setOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3 py-2 text-sm text-[--tips-muted]">
                {query ? "—" : ""}
              </p>
            )}
            {showAddNew && addNewLabel && onConfirmNew && (
              <button
                type="button"
                className="flex w-full items-center gap-2 border-t border-[--tips-glass-border] px-3 py-2.5 text-sm text-[--tips-club-lime] hover:bg-[--tips-glass-active]"
                onMouseDown={() => {
                  onConfirmNew();
                  setOpen(false);
                }}
              >
                <Plus className="h-3 w-3 shrink-0" />
                {addNewLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { t, locale } = useI18n();
  const { joinBgImageUrl } = useBranding();
  const code = params.code.toUpperCase();
  const mounted = useMounted();

  const [playerName, setPlayerName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companyInput, setCompanyInput] = useState("");
  const [companyConfirmed, setCompanyConfirmed] = useState(false);

  const { data: session, isLoading } = api.quiz.getSessionByCode.useQuery({
    joinCode: code,
  });
  const { data: companies } = api.company.list.useQuery();
  const { data: periods } = api.leaderboard.getActivePeriods.useQuery();

  const { data: companyPlayerNames } = api.company.listPlayerNames.useQuery(
    { companyId },
    { enabled: companyConfirmed && !!companyId },
  );

  const seasonPeriod = periods?.find((p) => p.type === "SEASON");
  const seasonEntries =
    seasonPeriod?.companyScores.map((s, i) => ({
      rank: i + 1,
      name: s.company.name,
      points: s.points,
    })) ?? [];

  const findOrCreateCompany = api.company.findOrCreate.useMutation();

  const joinMutation = api.participant.join.useMutation({
    onSuccess: (participant) => {
      localStorage.setItem(`oik-token-${session?.id}`, participant.sessionToken);
      toast.success(t("joinButton"));
      router.push(`/quiz/play/${session?.id}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  useEffect(() => {
    if (session?.status !== "LOBBY") {
      const token = localStorage.getItem(`oik-token-${session?.id}`);
      if (token && session) {
        router.push(`/quiz/play/${session.id}`);
      }
    }
  }, [session, router]);

  const companyOptions: ComboboxOption[] = useMemo(
    () =>
      companies?.map((c) => ({ value: c.id, label: c.name })) ?? [],
    [companies],
  );

  const isNewCompany =
    companyInput.trim().length > 0 &&
    !companies?.some(
      (c) => c.name.toLowerCase() === companyInput.trim().toLowerCase(),
    );

  const nameOptions: ComboboxOption[] = useMemo(() => {
    const names = new Set<string>();

    if (companyId && session) {
      for (const p of session.participants) {
        if (p.companyId === companyId) {
          names.add(p.playerName);
        }
      }
    }

    for (const name of companyPlayerNames ?? []) {
      names.add(name);
    }

    return [...names].map((name) => ({ value: name, label: name }));
  }, [companyId, companyPlayerNames, session]);

  const isNewName =
    playerName.trim().length > 0 &&
    !nameOptions.some(
      (o) => o.label.toLowerCase() === playerName.trim().toLowerCase(),
    );

  const resetCompanyStep = () => {
    setCompanyConfirmed(false);
    setCompanyId("");
    setPlayerName("");
  };

  const handleCompanyChange = (value: string) => {
    setCompanyInput(value);
    resetCompanyStep();
  };

  const handleSelectCompany = (option: ComboboxOption) => {
    setCompanyId(option.value);
    setCompanyInput(option.label);
    setCompanyConfirmed(true);
    setPlayerName("");
  };

  const handleConfirmNewCompany = () => {
    setCompanyId("");
    setCompanyConfirmed(true);
    setPlayerName("");
  };

  const handleSelectName = (option: ComboboxOption) => {
    setPlayerName(option.label);
  };

  const handleConfirmNewName = () => {
    // Name stays as typed — option confirms intent to use a new name
  };

  const handleJoin = async () => {
    if (!companyConfirmed || !playerName.trim() || !companyInput.trim()) return;

    let resolvedId = companyId;

    if (
      !resolvedId ||
      companies
        ?.find((c) => c.id === resolvedId)
        ?.name.toLowerCase() !== companyInput.trim().toLowerCase()
    ) {
      const company = await findOrCreateCompany.mutateAsync({
        name: companyInput.trim(),
      });
      resolvedId = company.id;
      setCompanyId(company.id);
    }

    const existingToken = session
      ? localStorage.getItem(`oik-token-${session.id}`)
      : undefined;

    joinMutation.mutate({
      joinCode: code,
      companyId: resolvedId,
      playerName: playerName.trim(),
      sessionToken: existingToken ?? undefined,
    });
  };

  if (!mounted || isLoading) {
    return (
      <MobileShell bgImage={joinBgImageUrl}>
        <p className="text-center text-muted-foreground">{t("rejoining")}</p>
      </MobileShell>
    );
  }

  if (!session) {
    return (
      <MobileShell bgImage={joinBgImageUrl}>
        <p className="text-center text-destructive">Quiz not found</p>
      </MobileShell>
    );
  }

  const pending = joinMutation.isPending || findOrCreateCompany.isPending;
  const canJoin = companyConfirmed && playerName.trim().length > 0;

  return (
    <MobileShell bgImage={joinBgImageUrl} showLogo={false}>
      <AppTitle subtitle={t("tagline")} />

      <div className="my-4 flex flex-wrap justify-center gap-2">
        <InfoPill icon={CalendarDays}>
          {t("match")} {session.quiz.matchNumber ?? "?"} {t("of")} 26
        </InfoPill>
        {session.quiz.matchTitle && (
          <InfoPill icon={Trophy}>{session.quiz.matchTitle}</InfoPill>
        )}
        <InfoPill icon={Users}>
          {session.participants.length} {t("participants")}
        </InfoPill>
      </div>

      <TipsGlassCard className="my-4 overflow-visible z-50">
        <p className="tips-display mb-4 text-center text-3xl tips-gold-text">
          {t("joinQuiz")}
        </p>
        <div className="space-y-4">
          {session.status !== "LOBBY" ? (
            <p className="text-center text-destructive">{t("cannotJoin")}</p>
          ) : (
            <>
              <JoinCombobox
                label={t("companyName")}
                value={companyInput}
                onChange={handleCompanyChange}
                onSelect={handleSelectCompany}
                options={companyOptions}
                placeholder={t("selectCompany")}
                showAddNew={isNewCompany}
                addNewLabel={t("addAsNewCompany").replace(
                  "{name}",
                  companyInput.trim(),
                )}
                onConfirmNew={handleConfirmNewCompany}
              />

              {isNewCompany && companyConfirmed && !companyId && (
                <p className="flex items-center gap-1 text-xs text-[--tips-club-lime]">
                  <Plus className="h-3 w-3" />
                  {t("newCompanyOnJoin")}
                </p>
              )}

              {companyConfirmed && (
                <JoinCombobox
                  label={t("yourName")}
                  value={playerName}
                  onChange={(value) => setPlayerName(value)}
                  onSelect={handleSelectName}
                  options={nameOptions}
                  placeholder={t("selectNameFromList")}
                  showAddNew={isNewName}
                  addNewLabel={t("addAsNewName").replace(
                    "{name}",
                    playerName.trim(),
                  )}
                  onConfirmNew={handleConfirmNewName}
                />
              )}

              <TipsButton
                onClick={() => void handleJoin()}
                disabled={pending || !canJoin}
                className="w-full"
                size="lg"
                variant="gold"
              >
                {t("joinButton")} &gt;
              </TipsButton>
            </>
          )}
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-[--tips-muted]">
          <Info className="h-3 w-3" />
          {t("oneAttempt")}
        </p>
      </TipsGlassCard>

      <div className="grid gap-4">
        <CompanyLeaderboard
          title={t("businessClubLeague")}
          subtitle={
            seasonPeriod
              ? localized(locale, seasonPeriod.nameSv, seasonPeriod.nameEn)
              : undefined
          }
          viewAllHref="/quiz/leaderboard"
          limit={5}
          entries={seasonEntries}
        />
      </div>
    </MobileShell>
  );
}
