"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  HomeAddress,
  IssueTag,
  QuizAnswers,
  SelectedDistricts,
  VotingPlan,
} from "./types";

const KEYS = {
  districts: "ballot-nyc:districts",
  quiz: "ballot-nyc:quiz",
  plan: "ballot-nyc:plan",
  priorities: "ballot-nyc:priorities",
  home: "ballot-nyc:home",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Swallow quota / private-mode errors.
  }
}

function usePersistent<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(read<T>(key, fallback));
    setHydrated(true);
    // We intentionally don't depend on fallback to avoid resets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        write(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, update, hydrated] as const;
}

export function useSelectedDistricts() {
  return usePersistent<SelectedDistricts>(KEYS.districts, {});
}

/**
 * The address the user looked up, kept on this device only so we can say
 * whose ballot this is and deep-link to their official poll site.
 */
export function useHomeAddress() {
  return usePersistent<HomeAddress | null>(KEYS.home, null);
}

export function useQuizAnswers() {
  return usePersistent<QuizAnswers>(KEYS.quiz, {});
}

export function usePriorities() {
  return usePersistent<IssueTag[]>(KEYS.priorities, []);
}

export function useVotingPlan() {
  return usePersistent<VotingPlan>(KEYS.plan, {
    registered: false,
    knowsRaces: false,
    hasPlan: false,
  });
}
