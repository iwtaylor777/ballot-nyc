"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Frame } from "@/components/Frame";
import { coveredDistricts } from "@/lib/data";
import { lookupAddress, type GeocodeResponse } from "@/lib/geocode";
import { fetchSuggestions, type SuggestionResult } from "@/lib/autocomplete";
import type { Place } from "@/lib/geo/places";
import { clearSavedData, useHomeAddress, useSelectedDistricts } from "@/lib/storage";
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

type Choices = { message: string; nearby: boolean; places: Place[] };

const EMPTY: SuggestionResult = { exact: [], nearby: [] };

function placeSub(p: Place): string {
  return [p.borough, p.zip].filter(Boolean).join(" · ");
}

export default function Onboarding() {
  const router = useRouter();
  const listId = useId();
  const [selected, setSelected, hydrated] = useSelectedDistricts();
  const [home, setHome, homeHydrated] = useHomeAddress();
  const [mode, setMode] = useState<Mode>("address");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupErr, setLookupErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [choices, setChoices] = useState<Choices | null>(null);
  const [outside, setOutside] = useState<string | null>(null);

  const [suggest, setSuggest] = useState<SuggestionResult>(EMPTY);
  const [highlight, setHighlight] = useState(-1);
  const [showSuggest, setShowSuggest] = useState(false);
  const suppressNext = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // Only districts we have a certified NYC ballot for — picking an upstate
  // district would produce a ballot we can't stand behind.
  const grouped = useMemo(
    () => ({
      us_house: coveredDistricts("us_house"),
      state_senate: coveredDistricts("state_senate"),
      state_assembly: coveredDistricts("state_assembly"),
      judicial: coveredDistricts("judicial"),
    }),
    [],
  );

  const options = useMemo(
    () => [
      ...suggest.exact.map((p) => ({ place: p, nearby: false })),
      ...suggest.nearby.map((p) => ({ place: p, nearby: true })),
    ],
    [suggest],
  );

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
    if (q.length < 3) {
      setSuggest(EMPTY);
      return;
    }
    const ctrl = new AbortController();
    const handle = window.setTimeout(() => {
      abortRef.current?.abort();
      abortRef.current = ctrl;
      fetchSuggestions(q, ctrl.signal)
        .then((s) => {
          // A slower earlier request must never overwrite newer suggestions.
          if (ctrl.signal.aborted) return;
          setSuggest(s);
          setHighlight(-1);
        })
        .catch((err) => {
          // Autocomplete is a nice-to-have; never block submit on it.
          if (err?.name !== "AbortError" && !ctrl.signal.aborted) setSuggest(EMPTY);
        });
    }, 200);
    return () => {
      window.clearTimeout(handle);
      ctrl.abort();
    };
  }, [address]);

  function handleResult(result: GeocodeResponse) {
    switch (result.status) {
      case "match": {
        // Replace the whole selection: merging would leave districts from a
        // previous address on the new ballot.
        setSelected(result.districts);
        setHome({
          label: result.address.label,
          houseNumber: result.address.houseNumber,
          street: result.address.street,
          borough: result.address.borough,
          zip: result.address.zip,
        });
        const d = result.districts as SelectedDistricts;
        if (FIELDS.every((f) => d[f.type as keyof SelectedDistricts])) {
          router.push("/ballot");
        } else {
          setNotice(
            `Matched ${result.address.label}, but we couldn't resolve every district. Fill in the rest below.`,
          );
          setMode("manual");
        }
        return;
      }
      case "choose":
        setChoices({
          message: result.message,
          nearby: result.reason === "nearby",
          places: result.choices,
        });
        return;
      case "outside_nyc":
        // Don't leave a previous NYC ballot sitting behind an out-of-city address.
        setSelected({});
        setHome(null);
        setOutside(result.message);
        return;
      default:
        setLookupErr(result.message);
    }
  }

  async function run(input: { address: string } | { place: Place }) {
    setShowSuggest(false);
    setLoading(true);
    setLookupErr(null);
    setNotice(null);
    setChoices(null);
    setOutside(null);
    try {
      handleResult(await lookupAddress(input));
    } catch {
      setLookupErr(
        "Lookup failed — check your connection and try again, or pick your districts manually.",
      );
    } finally {
      setLoading(false);
    }
  }

  // Arriving from the partner embed: /onboarding#a=<address>. The fragment
  // never reaches a server; clear it once read.
  useEffect(() => {
    if (!hydrated) return;
    const m = window.location.hash.match(/^#a=(.+)$/);
    if (!m) return;
    let a = "";
    try {
      a = decodeURIComponent(m[1]).slice(0, 200);
    } catch {
      return;
    }
    window.history.replaceState(null, "", window.location.pathname);
    if (!a.trim()) return;
    suppressNext.current = true;
    setAddress(a);
    void run({ address: a });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  function pickPlace(p: Place) {
    suppressNext.current = true;
    setAddress(p.label);
    setSuggest(EMPTY);
    void run({ place: p });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim() || loading) return;
    void run({ address });
  }

  if (!hydrated || !homeHydrated) {
    return (
      <Frame>
        <p className="stamp text-muted">LOADING…</p>
      </Frame>
    );
  }

  const listOpen = showSuggest && options.length > 0;
  const firstNearby = suggest.exact.length;

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
          Type your NYC street address. We&apos;ll find your exact districts.
        </p>
      </section>

      {home && allChosen && (
        <div className="mt-6 border-l-4 border-ink bg-ink/5 p-3">
          <p className="stamp text-muted">CURRENT BALLOT</p>
          <p className="mt-1 text-sm font-semibold">{home.label}</p>
          <Link href="/ballot" className="stamp mt-2 inline-block underline">
            Show my ballot →
          </Link>
        </div>
      )}

      <div className="mt-6 flex gap-0 border-[3px] border-ink" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "address"}
          onClick={() => setMode("address")}
          className={[
            "flex-1 py-3 text-sm font-bold uppercase tracking-widest",
            mode === "address" ? "bg-ink text-paper" : "bg-paper text-ink",
          ].join(" ")}
        >
          By address
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "manual"}
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
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="home-address" className="stamp block text-ink">
              Your home address
            </label>
            <p className="text-xs text-muted">
              Sent only to look up your districts — never stored on our
              servers. Apartment number not needed.
            </p>
            <div className="relative mt-2">
              <input
                id="home-address"
                type="text"
                role="combobox"
                inputMode="text"
                enterKeyHint="search"
                required
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setShowSuggest(true);
                  setLookupErr(null);
                  setChoices(null);
                  setOutside(null);
                }}
                onFocus={() => setShowSuggest(true)}
                onBlur={() => {
                  // Delay so a tap on a suggestion still registers.
                  window.setTimeout(() => setShowSuggest(false), 150);
                }}
                onKeyDown={(e) => {
                  if (!listOpen) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlight((h) => (h + 1) % options.length);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlight((h) => (h - 1 + options.length) % options.length);
                  } else if (e.key === "Enter" && highlight >= 0) {
                    e.preventDefault();
                    pickPlace(options[highlight].place);
                  } else if (e.key === "Escape") {
                    setShowSuggest(false);
                  }
                }}
                placeholder="365 Bond St"
                autoComplete="street-address"
                autoCapitalize="words"
                spellCheck={false}
                aria-autocomplete="list"
                aria-controls={listId}
                aria-expanded={listOpen}
                aria-activedescendant={
                  listOpen && highlight >= 0 ? `${listId}-${highlight}` : undefined
                }
                className="w-full border-[3px] border-ink bg-paper px-4 py-4 font-display text-2xl tracking-tight focus:bg-ember focus:text-paper focus:placeholder-paper/60"
              />
              {listOpen && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 border-[3px] border-ink bg-paper shadow-[6px_6px_0_0_var(--ink)]">
                  <ul id={listId} role="listbox" aria-label="Matching NYC addresses">
                    {options.map(({ place, nearby }, i) => (
                      <li
                        key={`${place.label}-${i}`}
                        id={`${listId}-${i}`}
                        role="option"
                        aria-selected={highlight === i}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickPlace(place)}
                        onMouseEnter={() => setHighlight(i)}
                        className={[
                          "block cursor-pointer border-b border-ink/15 px-4 py-3 text-left",
                          highlight === i
                            ? "bg-ink text-paper"
                            : "bg-paper text-ink hover:bg-ember hover:text-paper",
                        ].join(" ")}
                      >
                        {nearby && i === firstNearby && (
                          <span className="stamp mb-1 block text-ember">
                            No exact match — closest buildings:
                          </span>
                        )}
                        <span className="block text-sm font-semibold">{place.line1}</span>
                        <span className="block text-xs opacity-75">{placeSub(place)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="px-4 py-2 text-[11px] text-muted">
                    Not seeing yours? Tap <span className="font-bold">Look up</span> to
                    search every borough.
                  </p>
                </div>
              )}
            </div>
            {suggest.hint === "needs_number" && (
              <p className="mt-2 text-xs font-semibold text-emberDeep">
                Start with your building number — e.g. 365 Bond St.
              </p>
            )}
            {suggest.hint === "zip_only" && (
              <p className="mt-2 text-xs font-semibold text-emberDeep">
                A ZIP alone can cover several districts — add your street
                address.
              </p>
            )}
            <p className="mt-2 text-xs text-muted">
              Queens? Keep the hyphen: <span className="font-bold">37-17 30th St</span>.
              No need to add city or ZIP.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !address.trim()}
            className="w-full bg-ink px-6 py-5 text-paper disabled:opacity-30"
          >
            <span className="poster text-3xl">
              {loading ? "LOOKING UP…" : "LOOK UP MY DISTRICTS →"}
            </span>
          </button>

          <div aria-live="polite">
            {choices && (
              <div className="border-[3px] border-ink p-4">
                <p className="stamp text-ember">
                  {choices.nearby ? "NOT AN EXACT MATCH" : "WHICH ONE?"}
                </p>
                <p className="mt-1 text-sm text-ink/90">{choices.message}</p>
                <ul className="mt-3 space-y-2">
                  {choices.places.map((p, i) => (
                    <li key={`${p.label}-${i}`}>
                      <button
                        type="button"
                        onClick={() => pickPlace(p)}
                        className="block w-full border-2 border-ink px-3 py-3 text-left hover:bg-ember hover:text-paper"
                      >
                        <span className="block text-sm font-semibold">{p.line1}</span>
                        <span className="block text-xs opacity-75">
                          {placeSub(p) || p.label}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {outside && (
              <div className="border-[3px] border-ink p-4">
                <p className="stamp text-ember">OUTSIDE NEW YORK CITY</p>
                <p className="mt-1 text-sm text-ink/90">{outside}</p>
                <a
                  href="https://voterlookup.elections.ny.gov/"
                  target="_blank"
                  rel="noreferrer"
                  className="stamp mt-3 inline-block underline decoration-ember decoration-2 underline-offset-4"
                >
                  NY State voter lookup →
                </a>
              </div>
            )}

            {lookupErr && (
              <div className="border-l-4 border-ember bg-ember/10 p-3">
                <p className="stamp text-ember">NO MATCH YET</p>
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
          </div>

          <p className="pt-2 text-xs text-muted">
            Addresses from NYC&apos;s official address directory (NYC Planning
            GeoSearch). Districts from the U.S. Census Bureau. Not sure?{" "}
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
          {notice && (
            <p className="border-l-4 border-ember bg-ember/10 p-3 text-sm">
              {notice}
            </p>
          )}
          {FIELDS.map((f) => (
            <label key={f.type} className="block">
              <div className="stamp text-ink">{f.label}</div>
              <div className="text-xs text-muted">{f.hint}</div>
              <select
                required
                value={selected[f.type as keyof SelectedDistricts] ?? ""}
                onChange={(e) => {
                  setSelected((prev) => ({
                    ...prev,
                    [f.type]: e.target.value || undefined,
                  }));
                  // A hand-picked district no longer matches the saved address.
                  setHome(null);
                }}
                className="mt-2 w-full appearance-none border-[3px] border-ink bg-paper px-4 py-4 font-display text-2xl uppercase tracking-tight text-ink focus:bg-ember focus:text-paper"
              >
                <option value="" disabled>
                  — Select —
                </option>
                {grouped[f.type as keyof typeof grouped].map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          ))}

          <label className="block">
            <div className="stamp text-ink">Borough</div>
            <div className="text-xs text-muted">
              Optional — adds your State Supreme Court (judge) race
            </div>
            <select
              value={selected.judicial ?? ""}
              onChange={(e) => {
                setSelected((prev) => ({
                  ...prev,
                  judicial: e.target.value || undefined,
                }));
                setHome(null);
              }}
              className="mt-2 w-full appearance-none border-[3px] border-ink bg-paper px-4 py-4 font-display text-2xl uppercase tracking-tight text-ink focus:bg-ember focus:text-paper"
            >
              <option value="">— Skip —</option>
              {grouped.judicial.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.borough}
                </option>
              ))}
            </select>
          </label>

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
        Saved on this device only. No accounts.{" "}
        <Link href="/ballot" className="underline">
          Skip
        </Link>{" "}
        ·{" "}
        <button
          type="button"
          onClick={() => {
            clearSavedData();
            setSelected({});
            setHome(null);
            setAddress("");
            setSuggest(EMPTY);
            setNotice("Cleared everything saved on this device.");
          }}
          className="underline"
        >
          Clear my saved data
        </button>
      </p>
    </Frame>
  );
}
