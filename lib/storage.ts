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

/**
 * Stored values come from an earlier version of this site (or a hand-edited
 * localStorage), so a parsed value still has to look like what the caller
 * expects before we hand it over.
 */
function read<T>(key: string, fallback: T, isValid?: (v: unknown) => boolean): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || parsed === undefined) return fallback;
    if (isValid && !isValid(parsed)) {
      window.localStorage.removeItem(key);
      return fallback;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const stringValues = (v: unknown) =>
  isObject(v) && Object.values(v).every((x) => typeof x === "string" || x === undefined);

const numberValues = (v: unknown) =>
  isObject(v) && Object.values(v).every((x) => typeof x === "number");

/** Wipe everything this site keeps on the device. */
export function clearSavedData(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of Object.values(KEYS)) window.localStorage.removeItem(key);
  } catch {
    // Private mode / blocked storage — nothing to clear.
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

function usePersistent<T>(key: string, fallback: T, isValid?: (v: unknown) => boolean) {
  const [value, setValue] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(read<T>(key, fallback, isValid));
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
  return usePersistent<SelectedDistricts>(KEYS.districts, {}, stringValues);
}

/**
 * The address the user looked up, kept on this device only so we can say
 * whose ballot this is and deep-link to their official poll site.
 */
export function useHomeAddress() {
  return usePersistent<HomeAddress | null>(
    KEYS.home,
    null,
    (v) => isObject(v) && typeof v.label === "string",
  );
}

export function useQuizAnswers() {
  return usePersistent<QuizAnswers>(KEYS.quiz, {}, numberValues);
}

export function usePriorities() {
  return usePersistent<IssueTag[]>(KEYS.priorities, [], (v) =>
    Array.isArray(v) && v.every((x) => typeof x === "string"),
  );
}

export function useVotingPlan() {
  return usePersistent<VotingPlan>(
    KEYS.plan,
    { registered: false, knowsRaces: false, hasPlan: false },
    (v) => isObject(v) && Object.values(v).every((x) => typeof x === "boolean"),
  );
}
