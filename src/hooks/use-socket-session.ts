"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import {
  SOCKET_EVENTS,
  type FreeTextSubmission,
  type SessionStatePayload,
} from "~/lib/socket-events";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";

export function useSocketSession(options: {
  sessionId: string;
  sessionToken?: string;
  isAdmin?: boolean;
  adminSecret?: string;
  enabled?: boolean;
}) {
  const { sessionId, sessionToken, isAdmin, adminSecret, enabled = true } =
    options;
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<SessionStatePayload | null>(null);
  const [freeTextSubmissions, setFreeTextSubmissions] = useState<
    FreeTextSubmission[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      if (isAdmin && adminSecret) {
        socket.emit(SOCKET_EVENTS.JOIN_ADMIN, {
          sessionId,
          secret: adminSecret,
        });
      } else if (sessionToken) {
        socket.emit(SOCKET_EVENTS.JOIN_SESSION, { sessionId, sessionToken });
      }
    });

    socket.on("disconnect", () => setConnected(false));
    socket.on(SOCKET_EVENTS.SESSION_STATE, (payload: SessionStatePayload) => {
      setState(payload);
    });
    socket.on(
      SOCKET_EVENTS.FREE_TEXT_SUBMISSIONS,
      (payload: FreeTextSubmission[]) => {
        setFreeTextSubmissions(payload);
      },
    );
    socket.on(SOCKET_EVENTS.ERROR, (payload: { message: string }) => {
      setError(payload.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId, sessionToken, isAdmin, adminSecret, enabled]);

  const submitAnswer = (data: {
    quizQuestionId: string;
    optionId?: string;
    textAnswer?: string;
  }) => {
    socketRef.current?.emit(SOCKET_EVENTS.SUBMIT_ANSWER, data);
  };

  const startQuiz = () => {
    socketRef.current?.emit(SOCKET_EVENTS.START_QUIZ, { sessionId });
  };

  const startQuestion = (questionIndex: number) => {
    socketRef.current?.emit(SOCKET_EVENTS.START_QUESTION, {
      sessionId,
      questionIndex,
    });
  };

  const nextQuestion = (questionIndex: number) => {
    socketRef.current?.emit(SOCKET_EVENTS.NEXT_QUESTION, {
      sessionId,
      questionIndex,
    });
  };

  const awardFreeText = (
    awards: { answerId: string; isCorrect: boolean; points: number }[],
  ) => {
    socketRef.current?.emit(SOCKET_EVENTS.AWARD_FREE_TEXT, {
      sessionId,
      awards,
    });
  };

  const endQuiz = () => {
    socketRef.current?.emit(SOCKET_EVENTS.END_QUIZ, { sessionId });
  };

  return {
    connected,
    state,
    error,
    freeTextSubmissions,
    submitAnswer,
    startQuiz,
    startQuestion,
    nextQuestion,
    awardFreeText,
    endQuiz,
  };
}
