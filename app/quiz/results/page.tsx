"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { Frame } from "@/components/Frame";
import { ShareCard } from "@/components/ShareCard";
import { buildBallot, quiz } from "@/lib/data";
import { rankCandidates, topIssues } from "@/lib/scoreQuiz";
import {
  usePriorities,
  useQuizAnswers,
  useSelectedDistricts,
} from "@/lib/storage";
import { ISSUE_LABELS } from "@/lib/types";
import {
  candidateStatus,
  coverageCounts,
  STATUS_LABEL,
  type CandidateStatus,
} from "@/lib/quizStatus";

export default function Results() {
  const [answers, , answersHydrated] = useQuizAnswers();
  const [selected, , selectedHydrated] = useSelectedDistricts();
  const [priorities, , prioritiesHydrated] = usePriorities();
  const cardRef = useRef<HTMLDivElement>(null);
  // The card is always rendered at 1080×1920 for export; the on-screen preview
  // scales to whatever width the phone actually has (320px included). This is a
  // callback ref, not a mount effect: the page renders a loading gate first, so
  // an effect would run while the preview element doesn't exist yet.
  const [previewScale, setPreviewScale] = useState(0.3);
  const [exportState, setExportState] = useState<"idle" | "working" | "error">("idle");
  const observerRef = useRef<ResizeObserver | null>(null);

  const previewRef = useCallback((el: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!el) return;
    const fit = () => {
      // clientWidth excludes the border, which is what the card has to fit in.
      if (el.clientWidth > 0) setPreviewScale(el.clientWidth / 1080);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    observerRef.current = ro;
  }, []);

  const races = useMemo(() => buildBallot(selected), [selected]);
  const top = useMemo(
    () => topIssues(answers, quiz, priorities),
    [answers, priorities],
  );
  const answered = Object.keys(answers).length;

  // Rank once, so the copy and the rows agree about who could be compared.
  const rankedRaces = useMemo(
    () =>
      races.map((race) => {
        const judicial = race.office.scope === "judicial";
        const ranked = rankCandidates(race.candidates, answers, quiz, priorities).map(
          (c) => ({ ...c, status: candidateStatus(c, c.overlap, judicial) }),
        );
        return {
          race,
          judicial,
          scored: ranked.filter((c) => c.status === "scored"),
          rest: ranked.filter((c) => c.status !== "scored"),
          ranked,
        };
      }),
    [races, answers, priorities],
  );

  const coverage = useMemo(
    () =>
      coverageCounts(
        rankedRaces.flatMap((r) =>
          r.ranked.map((c) => ({
            positions: c.positions,
            overlap: c.overlap,
            judicial: r.judicial,
          })),
        ),
      ),
    [rankedRaces],
  );

  if (!answersHydrated || !selectedHydrated || !prioritiesHydrated) {
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

  async function renderCard(): Promise<Blob | null> {
    if (!cardRef.current) return null;
    const { toBlob } = await import("html-to-image");
    const opts = { cacheBust: true, pixelRatio: 1, width: 1080, height: 1920 };
    // Safari needs a warm-up pass or web fonts render incorrectly in the capture
    await toBlob(cardRef.current, opts);
    return toBlob(cardRef.current, opts);
  }

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-ballot-nyc.png";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function share() {
    setExportState("working");
    try {
      const blob = await renderCard();
      if (!blob) throw new Error("no image");
      const file = new File([blob], "my-ballot-nyc.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
        } catch (err) {
          // AbortError means the user closed the sheet — anything else is a
          // real failure and should fall back to a download.
          if ((err as Error)?.name !== "AbortError") downloadBlob(blob);
        }
      } else {
        downloadBlob(blob);
      }
      setExportState("idle");
    } catch {
      setExportState("error");
    }
  }

  async function download() {
    setExportState("working");
    try {
      const blob = await renderCard();
      if (!blob) throw new Error("no image");
      downloadBlob(blob);
      setExportState("idle");
    } catch {
      setExportState("error");
    }
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
        <div className="flex items-baseline justify-between">
          <p className="stamp text-muted">YOUR TOP ISSUES</p>
          <Link
            href="/quiz/priorities"
            className="stamp text-muted underline"
          >
            EDIT
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {top.map((tag) => (
            <span
              key={tag}
              className="border-2 border-ink bg-emberDeep px-3 py-2 font-display text-lg uppercase tracking-tight text-paper"
            >
              {ISSUE_LABELS[tag]}
            </span>
          ))}
        </div>
        {priorities.length === 0 && top.length > 0 && (
          <p className="mt-3 text-xs text-muted">
            Auto-picked from your strongest answers. Tap EDIT to set your own.
          </p>
        )}
      </section>

      <hr className="rule-thin my-8" />

      <section>
        <p className="stamp text-muted">HOW MUCH WE KNOW</p>
        <p className="mt-2 text-sm text-ink/90">
          Your ballot has{" "}
          <span className="font-bold">{coverage.total} candidates</span>. We
          have sourced positions for{" "}
          <span className="font-bold">{coverage.researched}</span>, and{" "}
          <span className="font-bold">{coverage.comparable}</span> of those
          line up with the {answered === 1 ? "one question" : `${answered} questions`} you
          answered.
          {coverage.judicial > 0 && (
            <>
              {" "}
              The {coverage.judicial} judicial candidates aren&apos;t scored at
              all.
            </>
          )}
        </p>
        {coverage.comparable < coverage.researched && (
          <p className="mt-2 text-sm text-ink/90">
            Answering more questions would let us compare{" "}
            {coverage.researched - coverage.comparable} more.{" "}
            <Link href="/quiz" className="font-bold underline">
              Finish the quiz →
            </Link>
          </p>
        )}
      </section>

      <section className="mt-10 space-y-10">
        {rankedRaces.map(({ race, judicial, scored, rest }) => {
          const researchedHere = [...scored, ...rest].filter(
            (c) => c.positions.length > 0,
          ).length;
          return (
            <div key={`${race.office.id}-${race.district.id}`}>
              <p className="stamp text-muted">
                {race.district.type === "statewide"
                  ? "STATEWIDE"
                  : race.district.name.toUpperCase()}
              </p>
              <h2 className="poster mt-1 text-3xl">{race.office.title}</h2>

              {judicial ? (
                <p className="mt-2 border-l-4 border-ink pl-3 text-sm text-ink/85">
                  Judicial candidates aren&apos;t scored. Judges apply the law
                  rather than run on policy platforms, so a policy quiz would be
                  misleading here.
                </p>
              ) : scored.length === 0 && researchedHere > 0 ? (
                <p className="mt-2 border-l-4 border-ink pl-3 text-sm text-ink/85">
                  We have positions for this race, but none on the questions you
                  answered.{" "}
                  <Link href="/quiz" className="font-bold underline">
                    Answer more →
                  </Link>
                </p>
              ) : (
                scored.length === 0 && (
                  <p className="mt-2 border-l-4 border-emberDeep pl-3 text-sm text-ink/85">
                    We haven&apos;t sourced positions for anyone in this race
                    yet, so there&apos;s nothing to match against.
                  </p>
                )
              )}

              <div className="mt-4 space-y-3">
                {scored.map((c) => (
                  <Link
                    key={c.id}
                    href={`/race/${race.office.id}/${race.district.id}`}
                    className="flex items-center justify-between gap-3 border-[3px] border-ink p-4 no-underline"
                  >
                    <div>
                      <div className="font-display text-2xl uppercase tracking-tight">
                        {c.name}
                      </div>
                      <div className="stamp text-muted">
                        {(c.lines?.join(" · ") ?? c.party).toUpperCase()}
                      </div>
                    </div>
                    <div className="max-w-[45%] text-right">
                      <div
                        className={[
                          "poster",
                          c.overlap >= 3 ? "text-4xl text-ember" : "text-3xl text-muted",
                        ].join(" ")}
                      >
                        {c.match}%
                      </div>
                      <div className="stamp text-muted">
                        {c.overlap} OF {answered} ISSUES
                      </div>
                    </div>
                  </Link>
                ))}

                {rest.map((c) => (
                  <Link
                    key={c.id}
                    href={`/race/${race.office.id}/${race.district.id}`}
                    className="flex items-center justify-between gap-3 border-2 border-ink/40 p-4 no-underline"
                  >
                    <div>
                      <div className="font-display text-xl uppercase tracking-tight">
                        {c.name}
                      </div>
                      <div className="stamp text-muted">
                        {(c.lines?.join(" · ") ?? c.party).toUpperCase()}
                      </div>
                    </div>
                    <div className="stamp max-w-[45%] text-right text-muted">
                      {STATUS_LABEL[c.status as Exclude<CandidateStatus, "scored">]}
                    </div>
                  </Link>
                ))}
              </div>

              {!judicial && scored.length > 0 && rest.length > 0 && (
                <p className="mt-2 text-xs text-muted">
                  Scores compare only the issues we could source and you
                  answered, so a candidate listed without one isn&apos;t less
                  aligned — we just can&apos;t compare them yet.
                </p>
              )}
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
          Story-format card with your top issues + the date. One tap to your
          story, group chat, or camera roll.
        </p>

        <div
          ref={previewRef}
          className="relative mt-5 w-full max-w-[324px] overflow-hidden border-[3px] border-ink"
          style={{ aspectRatio: "1080 / 1920" }}
        >
          <div
            style={{
              transform: `scale(${previewScale})`,
              transformOrigin: "top left",
              width: 1080,
              height: 1920,
            }}
          >
            <ShareCard ref={cardRef} topIssues={top} />
          </div>
        </div>

        <button
          onClick={share}
          disabled={exportState === "working"}
          className="mt-5 inline-flex w-full items-center justify-center bg-ember px-6 py-5 text-paper disabled:opacity-40"
        >
          <span className="poster text-3xl">
            {exportState === "working" ? "MAKING IMAGE…" : "SHARE CARD ↑"}
          </span>
        </button>
        {exportState === "error" && (
          <p role="alert" className="mt-2 text-sm font-semibold text-emberDeep">
            The image didn&apos;t render. Try again, or screenshot the preview
            above.
          </p>
        )}

        <button
          onClick={download}
          className="mt-3 inline-flex w-full items-center justify-center border-[3px] border-ink bg-paper px-6 py-4 text-ink"
        >
          <span className="poster text-xl">SAVE TO CAMERA ROLL ↓</span>
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
