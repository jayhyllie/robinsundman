"use client";

import { Check, X } from "lucide-react";

import { OPTION_COLORS, OPTION_LETTER_BG } from "~/lib/constants";
import { localized, useI18n } from "~/components/providers/i18n-provider";
import { TipsButton } from "~/components/tips/ui";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import type { QuestionOptionPayload } from "~/lib/socket-events";

type AnswerGridProps = {
  options: QuestionOptionPayload[];
  type: "MULTIPLE_CHOICE" | "FREE_TEXT";
  selectedOptionId?: string | null;
  textAnswer?: string;
  correctOptionId?: string | null;
  revealed?: boolean;
  disabled?: boolean;
  onSelectOption?: (optionId: string) => void;
  onTextChange?: (text: string) => void;
  onSubmitText?: () => void;
};

export function AnswerGrid({
  options,
  type,
  selectedOptionId,
  textAnswer = "",
  correctOptionId,
  revealed = false,
  disabled = false,
  onSelectOption,
  onTextChange,
  onSubmitText,
}: AnswerGridProps) {
  const { locale, t } = useI18n();

  if (type === "FREE_TEXT") {
    return (
      <div className="space-y-3">
        <Textarea
          value={textAnswer}
          onChange={(e) => onTextChange?.(e.target.value)}
          placeholder={t("typeAnswer")}
          disabled={disabled}
          className="min-h-24 rounded-[--tips-radius-sm] border-[--tips-glass-border] bg-[--tips-glass-bg] text-[--tips-rink-white] backdrop-blur-[20px] focus-visible:border-[--tips-club-lime]"
        />
        {!disabled && (
          <TipsButton
            onClick={onSubmitText}
            disabled={!textAnswer.trim()}
            className="w-full"
            size="lg"
          >
            {t("submitAnswer")}
          </TipsButton>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const isSelected = selectedOptionId === option.id;
        const isCorrect = revealed && correctOptionId === option.id;
        const isWrong =
          revealed && isSelected && correctOptionId !== option.id;

        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectOption?.(option.id)}
            className={cn(
              "tips-glass flex h-auto items-center justify-between gap-3 px-4 py-4 text-left whitespace-normal transition disabled:opacity-50",
              !revealed && (OPTION_COLORS[option.letter] ?? ""),
              revealed && !isCorrect && !isWrong && "opacity-50",
              isSelected && !revealed && "tips-glass-active ring-2 ring-[--tips-club-lime]",
              isCorrect &&
                "border-[--tips-ice-highlight] bg-[rgba(57,255,20,0.12)] shadow-[0_0_14px_rgba(57,255,20,0.35)]",
              isWrong &&
                "border-red-500 bg-red-500/15 shadow-[0_0_14px_rgba(239,68,68,0.3)]",
            )}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  "tips-display flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-base text-black",
                  OPTION_LETTER_BG[option.letter] ?? "bg-muted",
                )}
              >
                {option.letter}
              </span>
              <span className="font-[--tips-font-body] text-sm font-extrabold tracking-wide uppercase">
                {localized(locale, option.labelSv, option.labelEn)}
              </span>
            </span>

            {isCorrect && (
              <Check
                className="h-6 w-6 shrink-0 text-[--tips-ice-highlight]"
                strokeWidth={3}
                aria-label={t("correct")}
              />
            )}
            {isWrong && (
              <X
                className="h-6 w-6 shrink-0 text-red-500"
                strokeWidth={3}
                aria-label={t("wrong")}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
