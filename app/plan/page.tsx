"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Frame } from "@/components/Frame";
import { Countdown } from "@/components/Countdown";
import { ShareLink } from "@/components/ShareLink";
import { ELECTION, electionState, planSteps } from "@/lib/election";
import { useElectionNow } from "@/components/ElectionClock";
import { JsonLd } from "@/components/JsonLd";
import { abs, faqLd } from "@/lib/seo";
import { pollSiteUrl } from "@/lib/geo/places";
import { useHomeAddress, useVotingPlan } from "@/lib/storage";
import { getVoterFaq } from "@/lib/faq";

export default function PlanPage() {
  const [plan, setPlan, hydrated] = useVotingPlan();
  const [home] = useHomeAddress();
  const pollSite =
    home?.houseNumber && home.street
      ? pollSiteUrl({ houseNumber: home.houseNumber, street: home.street, zip: home.zip })
      : null;
  const now = useElectionNow();
  const { archived } = electionState(now);
  const STEPS = planSteps(now);
  const FAQ = getVoterFaq(now);

  const done = STEPS.filter((s) => plan[s.key]).length;
  const complete = done === STEPS.length;

  return (
    <Frame back={{ href: "/ballot", label: "BACK TO BALLOT" }}>
      <JsonLd data={faqLd(FAQ, abs("/plan"))} />
      <section className="pt-2">
        <p className="stamp text-ember">YOUR PLAN</p>
        <h1 className="poster mt-3 text-6xl">
          THREE STEPS.
          <br />
          THAT&apos;S IT.
        </h1>
        {!archived && <div className="mt-5 flex items-center gap-3 border-l-4 border-ember pl-4">
          <Countdown date={ELECTION.day} compact />
          <span className="stamp text-muted">
            UNTIL POLLS CLOSE
          </span>
        </div>}
        <div className="mt-5 h-1 w-full bg-ink/15">
          <motion.div
            className="h-1 bg-ember"
            initial={false}
            animate={{ width: `${(done / STEPS.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </section>

      <hr className="rule-thick my-8" />

      <ol className="space-y-5">
        {STEPS.map((s) => {
          const checked = hydrated && plan[s.key];
          return (
            <li
              key={s.key}
              className={[
                "border-[3px] border-ink p-5",
                checked ? "bg-ink text-paper" : "bg-paper",
              ].join(" ")}
            >
              <div className="flex items-baseline justify-between">
                <span
                  className={[
                    "poster text-6xl",
                    checked ? "text-paper" : "text-ember",
                  ].join(" ")}
                >
                  {s.num}
                </span>
                <button
                  disabled={!hydrated}
                  onClick={() =>
                    setPlan((prev) => ({ ...prev, [s.key]: !prev[s.key] }))
                  }
                  className={[
                    "flex h-12 w-12 items-center justify-center border-[3px]",
                    checked
                      ? "border-paper bg-paper text-ink"
                      : "border-ink bg-paper text-ink",
                  ].join(" ")}
                  aria-pressed={checked}
                  aria-label={`${s.title} — ${checked ? "mark not done" : "mark done"}`}
                >
                  {checked ? (
                    <span className="poster text-3xl">✓</span>
                  ) : null}
                </button>
              </div>
              <h2 className="poster mt-3 text-3xl">{s.title}</h2>
              <p
                className={[
                  "mt-2 text-base",
                  checked ? "text-paper/85" : "text-ink/85",
                ].join(" ")}
              >
                {s.body}
              </p>
              <a
                href={s.key === "hasPlan" && !archived && pollSite ? pollSite : s.cta.href}
                target={s.cta.href.startsWith("http") ? "_blank" : undefined}
                rel={s.cta.href.startsWith("http") ? "noreferrer" : undefined}
                className={[
                  "stamp mt-4 inline-block underline",
                  checked ? "text-paper" : "text-ink",
                ].join(" ")}
              >
                {s.cta.label}
              </a>
              {s.note && (
                <a
                  href={s.note.href}
                  target="_blank"
                  rel="noreferrer"
                  className={[
                    "mt-3 block text-sm underline",
                    checked ? "text-paper/90" : "text-muted",
                  ].join(" ")}
                >
                  {s.note.label}
                </a>
              )}
              {s.secondary && (
                <a
                  href={s.secondary.href}
                  target="_blank"
                  rel="noreferrer"
                  className={[
                    "stamp mt-2 block underline",
                    checked ? "text-paper" : "text-muted",
                  ].join(" ")}
                >
                  {s.secondary.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>

      {hydrated && complete && !archived && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 border-[3px] border-ink bg-ember p-5 text-paper"
        >
          <p className="poster text-4xl">PLAN LOCKED.</p>
          <p className="mt-2 text-sm">
            Your checklist is saved on this device. Check official poll-site hours before you go.
          </p>
        </motion.div>
      )}

      <hr className="rule-thin my-10" />

      <section>
        <p className="stamp text-muted">REAL QUESTIONS</p>
        <h2 className="poster mt-2 text-3xl">
          FAQs
        </h2>
        <dl className="mt-5 space-y-5">
          {FAQ.map((f) => (
            <div key={f.q} className="border-l-4 border-ink pl-4">
              <dt className="font-display text-xl uppercase tracking-tight">
                {f.q}
              </dt>
              <dd className="mt-1 text-sm text-ink/85">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <hr className="rule-thin my-10" />

      <ShareLink />

      <Link
        href="/quiz/results"
        className="mt-3 inline-flex w-full items-center justify-center border-[3px] border-ink bg-paper px-6 py-5 text-ink no-underline"
      >
        <span className="poster text-2xl">MY MATCHES + SHARE CARD →</span>
      </Link>
    </Frame>
  );
}
