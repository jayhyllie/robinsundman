import { customAlphabet } from "nanoid";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const generateJoinCode = customAlphabet(alphabet, 6);

export const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

export const OPTION_COLORS: Record<string, string> = {
  A: "border-green-500 bg-green-500/10",
  B: "border-yellow-500 bg-yellow-500/10",
  C: "border-blue-500 bg-blue-500/10",
  D: "border-gray-400 bg-gray-400/10",
};

export const OPTION_LETTER_BG: Record<string, string> = {
  A: "bg-green-500",
  B: "bg-yellow-400",
  C: "bg-blue-500",
  D: "bg-gray-400",
};

export const RANK_COLORS: Record<number, string> = {
  1: "text-accent",
  2: "text-white",
  3: "text-orange-400",
  4: "text-primary",
  5: "text-primary",
};
