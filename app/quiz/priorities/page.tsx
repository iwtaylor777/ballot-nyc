"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Frame } from "@/components/Frame";
import { quiz } from "@/lib/data";
import { suggestPriorities } from "@/lib/scoreQuiz";
import { usePriorities, useQuizAnswers } from "@/lib/storage";
import { ISSUE_LABELS, type IssueTag } from "@/lib/types";

const PICKABLE_ISSUES: IssueTag[] = Array.from(
  new Set(quiz.map((q) => q.tag)),
);
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
          <p className="stamp text-muted">YOUR PICKS</p>
          <p className="mt-1 text-xs text-muted">
            All three count the same in your matches. The order only sets how
            they appear on your shareable card.
          </p>
          <ol className="mt-3 space-y-2">
            {picks.map((tag, i) => (
              <li
                key={tag}
                className="flex items-center justify-between border-[3px] border-ink bg-emberDeep p-3 text-paper"
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
                    aria-label={`Move ${ISSUE_LABELS[tag]} up`}
                    className="border-2 border-paper px-3 py-1 text-paper disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(tag, 1)}
                    disabled={i === picks.length - 1}
                    aria-label={`Move ${ISSUE_LABELS[tag]} down`}
                    className="border-2 border-paper px-3 py-1 text-paper disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => toggle(tag)}
                    aria-label={`Remove ${ISSUE_LABELS[tag]}`}
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
          {PICKABLE_ISSUES.map((tag) => {
            const selected = picks.includes(tag);
            const disabled = !selected && remaining === 0;
            return (
              <button
                key={tag}
                onClick={() => toggle(tag)}
                disabled={disabled}
                aria-pressed={selected}
                className={[
                  "border-[3px] border-ink px-3 py-4 text-left transition-colors",
                  selected
                    ? "bg-ink text-paper"
                    : disabled
                      ? "bg-paper text-ink/40"
                      : "bg-paper text-ink hover:bg-emberDeep hover:text-paper",
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
        className="inline-flex w-full items-center justify-center bg-ember px-6 py-5 text-paper"
      >
        <span className="poster text-3xl">
          {picks.length === 0 ? "WEIGH EVERYTHING EQUALLY →" : "SEE MY MATCHES →"}
        </span>
      </button>
      {picks.length === 0 && (
        <p className="mt-2 text-center text-xs text-muted">
          With nothing picked, every issue you answered counts the same.
        </p>
      )}

      <Link
        href="/quiz/results"
        className="stamp mt-4 block text-center text-muted underline"
      >
        CANCEL — KEEP MY LAST PICKS
      </Link>
    </Frame>
  );
}
