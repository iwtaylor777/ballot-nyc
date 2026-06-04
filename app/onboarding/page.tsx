"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Frame } from "@/components/Frame";
import { districts } from "@/lib/data";
import { geocodeAddress } from "@/lib/geocode";
import {
  fetchSuggestions,
  type AddressSuggestion,
} from "@/lib/autocomplete";
import { useSelectedDistricts } from "@/lib/storage";
import type { DistrictType, SelectedDistricts } from "@/lib/types";

const FIELDS: Array<{ type: DistrictType; label: string; hint: string }> = [
  {
    type: "us_house",
    label: "U.S. House district",
    hint: "Federal — who represents you in Congress",
  },
  {
    type: "state_senate",
    label: "State Senate district",
    hint: "State legislature — Albany",
  },
  {
    type: "state_assembly",
    label: "State Assembly district",
    hint: "State legislature — Albany",
  },
];

type Mode = "address" | "manual";

export default function Onboarding() {
  const router = useRouter();
  const [selected, setSelected, hydrated] = useSelectedDistricts();
  const [mode, setMode] = useState<Mode>("address");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupErr, setLookupErr] = useState<string | null>(null);
  const [matched, setMatched] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const [showSuggest, setShowSuggest] = useState(false);
  const suppressNext = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const grouped = useMemo(() => {
    const out: Record<string, typeof districts> = {};
    for (const f of FIELDS) {
      out[f.type] = districts.filter((d) => d.type === f.type);
    }
    return out;
  }, []);

  const allChosen = FIELDS.every(
    (f) => selected[f.type as keyof SelectedDistricts],
  );

  // Debounced autocomplete lookup.
  useEffect(() => {
    if (suppressNext.current) {
      suppressNext.current = false;
      return;
    }
    const q = address.trim();
    if (q.length < 4) {
      setSuggestions([]);
      return;
    }
    const handle = window.setTimeout(() => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      fetchSuggestions(q, ctrl.signal)
        .then((s) => {
          setSuggestions(s);
          setShowSuggest(true);
          setHighlight(-1);
        })
        .catch((err) => {
          if (err?.name !== "AbortError") {
            // Autocomplete is a nice-to-have; never block submit on it.
            setSuggestions([]);
          }
        });
    }, 220);
    return () => window.clearTimeout(handle);
  }, [address]);

  function pickSuggestion(s: AddressSuggestion) {
    suppressNext.current = true;
    setAddress(s.oneLine);
    setSuggestions([]);
    setShowSuggest(false);
  }

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setShowSuggest(false);
    setLoading(true);
    setLookupErr(null);
    setMatched(null);
    try {
      const result = await geocodeAddress(address);
      if (!result) {
        setLookupErr(
          "We couldn't find that address. Include city, state, and ZIP — or pick a suggestion from the dropdown.",
        );
        return;
      }
      if (result.outsideNY) {
        setLookupErr(
          `That address isn't in New York. ${result.warnings[0] ?? ""}`,
        );
        return;
      }
      setSelected((prev) => ({ ...prev, ...result.districts }));
      setMatched(result.matchedAddress);
      if (Object.keys(result.districts).length === FIELDS.length) {
        router.push("/ballot");
      } else {
        setMode("manual");
      }
    } catch {
      setLookupErr(
        "Lookup failed. The Census service may be down. Try manual select.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) {
    return (
      <Frame>
        <p className="stamp text-muted">LOADING…</p>
      </Frame>
    );
  }

  return (
    <Frame back={{ href: "/", label: "BACK" }}>
      <section className="pt-2">
        <p className="stamp text-ember">STEP 1 OF 1</p>
        <h1 className="poster mt-3 text-6xl">
          BUILD YOUR
          <br />
          BALLOT.
        </h1>
        <p className="mt-4 text-base text-ink/90">
          Start typing your address — we&apos;ll suggest matches, then resolve
          your districts.
        </p>
      </section>

      <div className="mt-6 flex gap-0 border-[3px] border-ink">
        <button
          onClick={() => setMode("address")}
          className={[
            "flex-1 py-3 text-sm font-bold uppercase tracking-widest",
            mode === "address" ? "bg-ink text-paper" : "bg-paper text-ink",
          ].join(" ")}
        >
          By address
        </button>
        <button
          onClick={() => setMode("manual")}
          className={[
            "flex-1 py-3 text-sm font-bold uppercase tracking-widest",
            mode === "manual" ? "bg-ink text-paper" : "bg-paper text-ink",
          ].join(" ")}
        >
          Pick manually
        </button>
      </div>

      {mode === "address" ? (
        <form className="mt-8 space-y-4" onSubmit={lookup}>
          <label className="block">
            <div className="stamp text-ink">Your home address</div>
            <div className="text-xs text-muted">
              Used once, in your browser. Not saved to any server we run.
            </div>
            <div className="relative mt-2">
              <input
                type="text"
                required
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setShowSuggest(true);
                }}
                onFocus={() => setShowSuggest(true)}
                onBlur={() => {
                  // Delay so click on suggestion still fires.
                  window.setTimeout(() => setShowSuggest(false), 150);
                }}
                onKeyDown={(e) => {
                  if (!showSuggest || suggestions.length === 0) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlight((h) => (h + 1) % suggestions.length);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlight(
                      (h) => (h - 1 + suggestions.length) % suggestions.length,
                    );
                  } else if (e.key === "Enter" && highlight >= 0) {
                    e.preventDefault();
                    pickSuggestion(suggestions[highlight]);
                  } else if (e.key === "Escape") {
                    setShowSuggest(false);
                  }
                }}
                placeholder="350 5th Ave, New York, NY 10118"
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={showSuggest && suggestions.length > 0}
                className="w-full border-[3px] border-ink bg-paper px-4 py-4 font-display text-2xl tracking-tight focus:bg-ember focus:text-paper focus:placeholder-paper/60"
              />
              {showSuggest && suggestions.length > 0 && (
                <ul
                  role="listbox"
                  className="absolute left-0 right-0 top-full z-20 mt-1 border-[3px] border-ink bg-paper shadow-[6px_6px_0_0_var(--ink)]"
                >
                  {suggestions.map((s, i) => (
                    <li key={s.oneLine} role="option" aria-selected={highlight === i}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickSuggestion(s)}
                        onMouseEnter={() => setHighlight(i)}
                        className={[
                          "block w-full border-b border-ink/15 px-4 py-3 text-left text-sm font-semibold last:border-b-0",
                          highlight === i
                            ? "bg-ink text-paper"
                            : "bg-paper text-ink hover:bg-ember hover:text-paper",
                        ].join(" ")}
                      >
                        {s.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="mt-2 text-xs text-muted">
              Tip: include city, state, and ZIP for the most reliable match
              (e.g. <span className="font-bold">350 5th Ave, New York, NY 10118</span>).
            </p>
          </label>

          <button
            type="submit"
            disabled={loading || !address.trim()}
            className="w-full bg-ink px-6 py-5 text-paper disabled:opacity-30"
          >
            <span className="poster text-3xl">
              {loading ? "LOOKING UP…" : "LOOK UP MY DISTRICTS →"}
            </span>
          </button>

          {lookupErr && (
            <div className="border-l-4 border-ember bg-ember/10 p-3">
              <p className="stamp text-ember">LOOKUP FAILED</p>
              <p className="mt-1 text-sm text-ink/90">{lookupErr}</p>
              <button
                onClick={() => setMode("manual")}
                className="mt-2 text-xs font-bold uppercase underline"
                type="button"
              >
                Pick manually instead →
              </button>
            </div>
          )}
          {matched && !lookupErr && (
            <p className="stamp text-muted">MATCHED · {matched}</p>
          )}
          <p className="pt-2 text-xs text-muted">
            Suggestions via Photon (OpenStreetMap). District lookup via the
            free U.S. Census Geocoder. Not sure?{" "}
            <a
              href="https://findmypollsite.vote.nyc/"
              target="_blank"
              rel="noreferrer"
              className="font-bold underline"
            >
              NYC poll site lookup →
            </a>
          </p>
        </form>
      ) : (
        <form
          className="mt-8 space-y-7"
          onSubmit={(e) => {
            e.preventDefault();
            router.push("/ballot");
          }}
        >
          {FIELDS.map((f) => (
            <label key={f.type} className="block">
              <div className="stamp text-ink">{f.label}</div>
              <div className="text-xs text-muted">{f.hint}</div>
              <select
                required
                value={selected[f.type as keyof SelectedDistricts] ?? ""}
                onChange={(e) =>
                  setSelected((prev) => ({
                    ...prev,
                    [f.type]: e.target.value || undefined,
                  }))
                }
                className="mt-2 w-full appearance-none border-[3px] border-ink bg-paper px-4 py-4 font-display text-2xl uppercase tracking-tight text-ink focus:bg-ember focus:text-paper"
              >
                <option value="" disabled>
                  — Select —
                </option>
                {grouped[f.type].map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          ))}

          <button
            type="submit"
            disabled={!allChosen}
            className="w-full bg-ink px-6 py-5 text-paper disabled:opacity-30"
          >
            <span className="poster text-3xl">SHOW MY BALLOT →</span>
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-muted">
        Stored on your device only. No accounts, no server.{" "}
        <Link href="/ballot" className="underline">
          Skip
        </Link>
      </p>
    </Frame>
  );
}
