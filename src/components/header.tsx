import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-bd-grid-strong bg-bd-surface">
      <div className="mx-auto max-w-[1200px] px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-bd-orange flex items-center justify-center">
            <span className="font-mono text-sm font-bold text-white leading-none">
              BD
            </span>
          </div>
          <span className="font-heading text-xl font-bold text-bd-text tracking-tight">
            BrickData
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-body">
          <Link
            href="/about"
            className="text-bd-text-secondary hover:text-bd-text transition-colors"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-bd-text-secondary hover:text-bd-text transition-colors"
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
