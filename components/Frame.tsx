import Link from "next/link";

export function Frame({
  children,
  back,
}: {
  children: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[640px] flex-col">
      <header className="flex items-center justify-between px-5 pt-5">
        <Link href="/" className="stamp text-ink no-underline">
          BALLOT · NYC
        </Link>
        <span className="stamp text-muted">NOV 3 · 2026</span>
      </header>
      {back && (
        <div className="px-5 pt-4">
          <Link
            href={back.href}
            className="stamp inline-flex items-center gap-2 text-ink no-underline hover:text-ember"
          >
            ← {back.label}
          </Link>
        </div>
      )}
      <main className="flex-1 px-5 pb-24 pt-2">{children}</main>
      <footer className="border-t border-ink px-5 py-5">
        <p className="stamp text-muted">
          NONPARTISAN · NO ACCOUNTS · NO TRACKING
        </p>
      </footer>
    </div>
  );
}
