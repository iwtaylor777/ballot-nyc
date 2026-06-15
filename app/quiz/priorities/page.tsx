"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Frame } from "@/components/Frame";
import { quiz } from "@/lib/data";
import { suggestPriorities } from "@/lib/scoreQuiz";
import { usePriorities, useQuizAnswers } from "@/lib/storage";
import { ISSUE_LABELS, type IssueTag } from "@/lib/types";

const ALL_ISSUES: IssueTag[] = Object.keys(ISSUE_LABELS) as IssueTag[];
const MAX_PICKS = 3;

export default function PrioritiesPage() {
  const router = useRouter();
  const [answers, , answersHydrated] = useQuizAnswers();
  const [stored, setStored, storedHydrated] = usePriorities();
  const [picks, setPicks] = useState<IssueTag[]>([]);

  const suggested = useMemo(
    () => suggestPriorities(answers, quiz),
    [answers],
  );

  useEffect(() => {
    if (!answersHydrated || !storedHydrated) return;
    setPicks(stored.length > 0 ? stored : suggested);
  }, [answersHydrated, storedHydrated, stored, suggested]);

  if (!answersHydrated || !storedHydrated) {
    return (
      <Frame>
        <p className="stamp text-muted">LOADING…</p>
      </Frame>
    );
  }

  function toggle(tag: IssueTag) {
    setPicks((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_PICKS) return prev;
      return [...prev, tag];
    });
  }

  function move(tag: IssueTag, dir: -1 | 1) {
    setPicks((prev) => {
      const i = prev.indexOf(tag);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function commit() {
    setStored(picks);
    router.push("/quiz/results");
  }

  const remaining = MAX_PICKS - picks.length;

  return (
    <Frame back={{ href: "/quiz", label: "BACK TO QUIZ" }}>
      <section className="pt-2">
        <p className="stamp text-ember">ONE MORE THING</p>
        <h1 className="poster mt-3 text-5xl">
          WHAT MATTERS
          <br />
          MOST?
        </h1>
        <p className="mt-4 text-base text-ink/85">
          Pick up to {MAX_PICKS} issues that drive your vote. These get extra
          weight when we match you to candidates — and they&apos;re what shows
          up on your shareable card.
        </p>
      </section>

      <hr className="rule-thick my-8" />

      {picks.length > 0 && (
        <section>
          <p className="stamp text-muted">
            YOUR PICKS · TAP ARROWS TO REORDER
          </p>
          <ol className="mt-3 space-y-2">
            {picks.map((tag, i) => (
              <li
                key={tag}
                className="flex items-center justify-between border-[3px] border-ink bg-ember p-3 text-paper"
              >
                <div className="flex items-center gap-3">
                  <span className="poster text-3xl">{i + 1}</span>
                  <span className="font-display text-xl uppercase tracking-tight">
                    {ISSUE_LABELS[tag]}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => move(tag, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="border-2 border-paper px-3 py-1 text-paper disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(tag, 1)}
                    disabled={i === picks.length - 1}
                    aria-label="Move down"
                    className="border-2 border-paper px-3 py-1 text-paper disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => toggle(tag)}
                    aria-label="Remove"
                    className="ml-1 border-2 border-paper px-3 py-1 text-paper"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-8">
        <p className="stamp text-muted">
          {remaining > 0
            ? `PICK ${remaining} MORE`
            : "MAX REACHED · DESELECT TO SWAP"}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {ALL_ISSUES.map((tag) => {
            const selected = picks.includes(tag);
            const disabled = !selected && remaining === 0;
            return (
              <button
                key={tag}
                onClick={() => toggle(tag)}
                disabled={disabled}
                className={[
                  "border-[3px] border-ink px-3 py-4 text-left transition-colors",
                  selected
                    ? "bg-ink text-paper"
                    : disabled
                      ? "bg-paper text-ink/40"
                      : "bg-paper text-ink hover:bg-ember hover:text-paper",
                ].join(" ")}
              >
                <span className="font-display text-lg uppercase tracking-tight">
                  {ISSUE_LABELS[tag]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <hr className="rule-thin my-8" />

      <button
        onClick={commit}
        disabled={picks.length === 0}
        className="inline-flex w-full items-center justify-center bg-ember px-6 py-5 text-paper disabled:opacity-40"
      >
        <span className="poster text-3xl">SEE MY MATCHES →</span>
      </button>

      <Link
        href="/quiz/results"
        className="stamp mt-4 block text-center text-muted underline"
      >
        SKIP — JUST SHOW ME
      </Link>
    </Frame>
  );
}
