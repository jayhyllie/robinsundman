export type LeaderboardEntry = {
  rank: number;
  id: string;
  name: string;
  company: string;
  points: number;
  initials: string;
};

export type ParticipantSummary = {
  id: string;
  name: string;
  company: string;
  initials: string;
};

export type QuestionOptionPayload = {
  id: string;
  letter: string;
  labelSv: string;
  labelEn: string | null;
};

export type QuestionPayload = {
  id: string;
  quizQuestionId: string;
  order: number;
  textSv: string;
  textEn: string | null;
  type: "MULTIPLE_CHOICE" | "FREE_TEXT";
  timeLimitSec: number;
  options: QuestionOptionPayload[];
};

export type SessionStatePayload = {
  sessionId: string;
  /** Monotonic per-session emit counter — clients ignore older payloads. */
  seq?: number;
  status:
    | "LOBBY"
    | "QUESTION_ACTIVE"
    | "QUESTION_REVEAL"
    | "FREE_TEXT_REVIEW"
    | "COMPLETED";
  currentQuestionIndex: number;
  totalQuestions: number;
  participantCount: number;
  questionStartedAt: string | null;
  questionEndsAt: string | null;
  currentQuestion: QuestionPayload | null;
  correctOptionId: string | null;
  leaderboard: LeaderboardEntry[];
  participants: ParticipantSummary[];
  matchTitle: string | null;
  matchNumber: number | null;
  quizTitleSv: string;
  quizTitleEn: string | null;
};

export type FreeTextSubmission = {
  answerId: string;
  participantId: string;
  playerName: string;
  companyName: string;
  textAnswer: string;
};

export const SOCKET_EVENTS = {
  JOIN_SESSION: "join_session",
  JOIN_ADMIN: "join_admin",
  SESSION_STATE: "session_state",
  PARTICIPANT_JOINED: "participant_joined",
  SUBMIT_ANSWER: "submit_answer",
  ANSWER_RECEIVED: "answer_received",
  START_QUIZ: "start_quiz",
  START_QUESTION: "start_question",
  QUESTION_TICK: "question_tick",
  REVEAL_ANSWER: "reveal_answer",
  NEXT_QUESTION: "next_question",
  END_QUIZ: "end_quiz",
  FREE_TEXT_SUBMISSIONS: "free_text_submissions",
  AWARD_FREE_TEXT: "award_free_text",
  ERROR: "error",
} as const;
