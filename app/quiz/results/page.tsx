"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import { Frame } from "@/components/Frame";
import { ShareCard } from "@/components/ShareCard";
import { buildBallot, quiz } from "@/lib/data";
import { rankCandidates, topIssues } from "@/lib/scoreQuiz";
import { useQuizAnswers, useSelectedDistricts } from "@/lib/storage";
import { ISSUE_LABELS } from "@/lib/types";

export default function Results() {
  const [answers, , answersHydrated] = useQuizAnswers();
  const [selected, , selectedHydrated] = useSelectedDistricts();
  const cardRef = useRef<HTMLDivElement>(null);

  const races = useMemo(() => buildBallot(selected), [selected]);
  const top = useMemo(() => topIssues(answers, quiz), [answers]);
  const answered = Object.keys(answers).length;

  if (!answersHydrated || !selectedHydrated) {
    return (
      <Frame>
        <p className="stamp text-muted">LOADING…</p>
      </Frame>
    );
  }

  if (answered === 0) {
    return (
      <Frame back={{ href: "/ballot", label: "BACK" }}>
        <h1 className="poster mt-6 text-5xl">NO ANSWERS YET.</h1>
        <p className="mt-4 text-base text-ink/90">
          Take the quiz to see where you line up.
        </p>
        <Link
          href="/quiz"
          className="mt-6 inline-flex w-full items-center justify-center bg-ink px-6 py-5 text-paper no-underline"
        >
          <span className="poster text-3xl">START QUIZ →</span>
        </Link>
      </Frame>
    );
  }

  async function download() {
    if (!cardRef.current) return;
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(cardRef.current, {
      cacheBust: true,
      pixelRatio: 1,
      width: 1080,
      height: 1920,
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "my-ballot-nyc.png";
    a.click();
  }

  return (
    <Frame back={{ href: "/quiz", label: "RETAKE" }}>
      <section className="pt-2">
        <p className="stamp text-ember">YOUR MATCHES</p>
        <h1 className="poster mt-3 text-6xl">
          HERE&apos;S WHERE
          <br />
          YOU LINE UP.
        </h1>
        <p className="mt-4 text-sm text-muted">
          This isn&apos;t a recommendation. It&apos;s a mirror — your answers
          mapped to candidates&apos; stated positions.
        </p>
      </section>

      <hr className="rule-thick my-8" />

      <section>
        <p className="stamp text-muted">YOUR TOP ISSUES</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {top.map((tag) => (
            <span
              key={tag}
              className="border-2 border-ink bg-ember px-3 py-2 font-display text-lg uppercase tracking-tight text-paper"
            >
              {ISSUE_LABELS[tag]}
            </span>
          ))}
        </div>
      </section>

      <hr className="rule-thin my-8" />

      <section className="space-y-10">
        {races.map((race) => {
          const ranked = rankCandidates(race.candidates, answers, quiz).filter(
            (c) => c.overlap > 0,
          );
          if (ranked.length === 0) return null;
          return (
            <div key={`${race.office.id}-${race.district.id}`}>
              <p className="stamp text-muted">
                {race.district.type === "statewide"
                  ? "STATEWIDE"
                  : race.district.name.toUpperCase()}
              </p>
              <h2 className="poster mt-1 text-3xl">{race.office.title}</h2>

              <div className="mt-4 space-y-3">
                {ranked.map((c) => (
                  <Link
                    key={c.id}
                    href={`/race/${race.office.id}/${race.district.id}`}
                    className="flex items-center justify-between border-[3px] border-ink p-4 no-underline"
                  >
                    <div>
                      <div className="font-display text-2xl uppercase tracking-tight">
                        {c.name}
                      </div>
                      <div className="stamp text-muted">
                        {c.party.toUpperCase()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="poster text-4xl text-ember">
                        {c.match}%
                      </div>
                      <div className="stamp text-muted">MATCH</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <hr className="rule-thick my-10" />

      <section>
        <p className="stamp text-muted">SHARE</p>
        <h2 className="poster mt-2 text-4xl">
          POST THIS,
          <br />
          BRING A FRIEND.
        </h2>
        <p className="mt-3 text-sm text-ink/90">
          Story-format card with your top issues + the date. Saves to your
          camera roll.
        </p>

        <div
          className="relative mt-5 overflow-hidden border-[3px] border-ink"
          style={{ width: 324, height: 576 }}
        >
          <div
            style={{
              transform: "scale(0.3)",
              transformOrigin: "top left",
              width: 1080,
              height: 1920,
            }}
          >
            <ShareCard ref={cardRef} topIssues={top} />
          </div>
        </div>

        <button
          onClick={download}
          className="mt-5 inline-flex w-full items-center justify-center bg-ember px-6 py-5 text-paper"
        >
          <span className="poster text-3xl">DOWNLOAD CARD ↓</span>
        </button>

        <Link
          href="/plan"
          className="mt-3 inline-flex w-full items-center justify-center border-[3px] border-ink bg-paper px-6 py-5 text-ink no-underline"
        >
          <span className="poster text-2xl">MAKE MY VOTING PLAN →</span>
        </Link>
      </section>
    </Frame>
  );
}
