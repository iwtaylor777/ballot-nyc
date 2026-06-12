"use client";

import { forwardRef } from "react";
import { ISSUE_LABELS, type IssueTag } from "@/lib/types";
import { keyDates } from "@/lib/data";

interface Props {
  topIssues: IssueTag[];
}

/**
 * 1080×1920 story-format shareable card. Rendered at full size for
 * html-to-image capture; the calling page is responsible for any
 * on-screen scaling/preview wrapper.
 */
export const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard(
  { topIssues },
  ref,
) {
  const electionDay = keyDates.find((d) => d.id === "election-day")!.date;
  const target = new Date(electionDay);
  const today = new Date();
  const days = Math.max(
    0,
    Math.ceil((target.getTime() - today.getTime()) / 86_400_000),
  );

  return (
    <div
      ref={ref}
      className="relative flex flex-col justify-between bg-paper p-[80px] text-ink"
      style={{ width: 1080, height: 1920 }}
    >
      <div>
        <div className="stamp text-[28px] tracking-[0.2em] text-ember">
          BALLOT · NYC
        </div>
        <h1 className="poster mt-[40px] text-[180px] leading-[0.85]">
          MY
          <br />
          BALLOT.
        </h1>
        <div className="mt-[40px] h-[8px] w-[200px] bg-ink" />
      </div>

      <div>
        <div className="stamp text-[28px] tracking-[0.2em] text-ink">
          THE STUFF I CARE ABOUT
        </div>
        <div className="mt-[32px] flex flex-col gap-[20px]">
          {topIssues.map((t) => (
            <span
              key={t}
              className="font-display text-[88px] uppercase leading-none tracking-tight"
              style={{ color: "var(--ink)" }}
            >
              / {ISSUE_LABELS[t]}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="h-[8px] w-full bg-ink" />
        <div className="mt-[40px] flex items-end justify-between">
          <div>
            <div className="stamp text-[28px] tracking-[0.2em] text-muted">
              ELECTION DAY
            </div>
            <div
              className="poster text-[140px] leading-none"
              style={{ color: "var(--ember)" }}
            >
              NOV 3
            </div>
          </div>
          <div className="text-right">
            <div className="stamp text-[28px] tracking-[0.2em] text-muted">
              DAYS LEFT
            </div>
            <div className="poster text-[140px] leading-none">{days}</div>
          </div>
        </div>
        <div className="mt-[40px] text-[36px] font-bold leading-tight">
          Are you registered? Pull up your ballot at ballotnyc.org.
        </div>
      </div>
    </div>
  );
});
