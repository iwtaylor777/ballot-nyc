"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Frame } from "@/components/Frame";
import { Countdown } from "@/components/Countdown";
import { keyDates } from "@/lib/data";
import { useVotingPlan } from "@/lib/storage";
import type { VotingPlan } from "@/lib/types";

const STEPS: Array<{
  key: keyof VotingPlan;
  num: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
}> = [
  {
    key: "registered",
    num: "01",
    title: "Get registered.",
    body: "If you're already registered in NY, check it. If you moved within NY, re-register at your new address.",
    cta: {
      label: "Register / check status →",
      href: "https://voterlookup.elections.ny.gov/",
    },
  },
  {
    key: "knowsRaces",
    num: "02",
    title: "Know your races.",
    body: "Open your personalized ballot. Open the matches quiz. You don't need to memorize anything — just don't show up blank.",
    cta: { label: "Open my ballot →", href: "/ballot" },
  },
  {
    key: "hasPlan",
    num: "03",
    title: "Pick when, where, how.",
    body: "Early voting (Oct 24 – Nov 1), Election Day (Nov 3, 6 AM – 9 PM), or mail. Decide now and put it on your calendar.",
    cta: {
      label: "Find my poll site →",
      href: "https://findmypollsite.vote.nyc/",
    },
  },
];

export default function PlanPage() {
  const [plan, setPlan, hydrated] = useVotingPlan();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState<"idle" | "ok" | "error">("idle");
  const electionDay = keyDates.find((d) => d.id === "election-day")!.date;

  if (!hydrated) {
    return (
      <Frame>
        <p className="stamp text-muted">LOADING…</p>
      </Frame>
    );
  }

  const done = STEPS.filter((s) => plan[s.key]).length;
  const complete = done === STEPS.length;

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    const endpoint = process.env.NEXT_PUBLIC_SIGNUP_ENDPOINT;
    if (!endpoint) {
      setSubmitted("error");
      return;
    }
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "ballot-nyc-plan" }),
      });
      setSubmitted(res.ok ? "ok" : "error");
    } catch {
      setSubmitted("error");
    }
  }

  return (
    <Frame back={{ href: "/ballot", label: "BACK TO BALLOT" }}>
      <section className="pt-2">
        <p className="stamp text-ember">YOUR PLAN</p>
        <h1 className="poster mt-3 text-6xl">
          THREE STEPS.
          <br />
          THAT&apos;S IT.
        </h1>
        <div className="mt-5 flex items-center gap-3 border-l-4 border-ember pl-4">
          <Countdown date={electionDay} compact />
          <span className="stamp text-muted">UNTIL POLLS CLOSE</span>
        </div>
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
          const checked = plan[s.key];
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
                  aria-label={checked ? "Mark not done" : "Mark done"}
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
                href={s.cta.href}
                target={s.cta.href.startsWith("http") ? "_blank" : undefined}
                rel={s.cta.href.startsWith("http") ? "noreferrer" : undefined}
                className={[
                  "stamp mt-4 inline-block underline",
                  checked ? "text-paper" : "text-ink",
                ].join(" ")}
              >
                {s.cta.label}
              </a>
            </li>
          );
        })}
      </ol>

      {complete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 border-[3px] border-ink bg-ember p-5 text-paper"
        >
          <p className="poster text-4xl">PLAN LOCKED.</p>
          <p className="mt-2 text-sm">
            Bring a friend on Nov 3. That&apos;s the whole game.
          </p>
        </motion.div>
      )}

      <hr className="rule-thin my-10" />

      <section>
        <p className="stamp text-muted">REMINDERS</p>
        <h2 className="poster mt-2 text-3xl">
          ONE EMAIL.
          <br />
          ON ELECTION WEEK.
        </h2>
        <p className="mt-2 text-sm text-ink/85">
          Plain reminder of your races and your plan. No spam, no asks, no
          tracking pixels.
        </p>
        <form onSubmit={submitEmail} className="mt-4 flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="border-[3px] border-ink bg-paper px-4 py-4 font-display text-2xl tracking-tight focus:bg-ember focus:text-paper focus:placeholder-paper/60"
          />
          <button
            type="submit"
            className="bg-ink px-6 py-5 text-paper"
            disabled={submitted === "ok"}
          >
            <span className="poster text-2xl">
              {submitted === "ok" ? "✓ ON THE LIST" : "REMIND ME →"}
            </span>
          </button>
          {submitted === "error" && (
            <p className="stamp text-ember">
              SIGNUP ENDPOINT NOT CONFIGURED — see NEXT_PUBLIC_SIGNUP_ENDPOINT.
            </p>
          )}
        </form>
      </section>

      <hr className="rule-thin my-10" />

      <Link
        href="/quiz/results"
        className="inline-flex w-full items-center justify-center border-[3px] border-ink bg-paper px-6 py-5 text-ink no-underline"
      >
        <span className="poster text-2xl">SHARE MY BALLOT →</span>
      </Link>
    </Frame>
  );
}
