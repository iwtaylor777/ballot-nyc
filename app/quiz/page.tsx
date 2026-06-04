"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Frame } from "@/components/Frame";
import { quiz } from "@/lib/data";
import { useQuizAnswers } from "@/lib/storage";

export default function QuizPage() {
  const router = useRouter();
  const [answers, setAnswers, hydrated] = useQuizAnswers();
  const [idx, setIdx] = useState(0);

  if (!hydrated) {
    return (
      <Frame>
        <p className="stamp text-muted">LOADING…</p>
      </Frame>
    );
  }

  const q = quiz[idx];
  const isLast = idx === quiz.length - 1;
  const progress = Math.round(((idx + 1) / quiz.length) * 100);

  function choose(value: number) {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    if (isLast) {
      router.push("/quiz/results");
    } else {
      setIdx(idx + 1);
    }
  }

  return (
    <Frame
      back={
        idx === 0
          ? { href: "/ballot", label: "BACK TO BALLOT" }
          : undefined
      }
    >
      <div className="flex items-center justify-between pt-2">
        <p className="stamp text-ember">
          QUESTION {idx + 1} / {quiz.length}
        </p>
        <button
          onClick={() => router.push("/quiz/results")}
          className="stamp text-muted underline"
        >
          SKIP TO RESULTS
        </button>
      </div>

      <div className="mt-3 h-1 w-full bg-ink/15">
        <motion.div
          className="h-1 bg-ember"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="poster mt-10 text-5xl sm:text-6xl">{q.prompt}</h1>

          <div className="mt-8 space-y-3">
            {q.options.map((opt) => {
              const selected = answers[q.id] === opt.value;
              return (
                <button
                  key={opt.label}
                  onClick={() => choose(opt.value)}
                  className={[
                    "block w-full border-[3px] border-ink px-5 py-5 text-left transition-colors",
                    selected
                      ? "bg-ink text-paper"
                      : "bg-paper text-ink hover:bg-ember hover:text-paper",
                  ].join(" ")}
                >
                  <span className="font-display text-2xl uppercase tracking-tight">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {q.learnMore && (
            <a
              href={q.learnMore.url}
              target="_blank"
              rel="noreferrer"
              className="stamp mt-8 inline-block text-muted underline decoration-ember decoration-2 underline-offset-4 hover:text-ember"
            >
              ↗ {q.learnMore.label}
            </a>
          )}

          {idx > 0 && (
            <button
              onClick={() => setIdx(idx - 1)}
              className="stamp mt-6 block text-muted underline"
            >
              ← PREVIOUS
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </Frame>
  );
}
