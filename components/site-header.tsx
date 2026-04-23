import Link from "next/link";
import { siteConfig } from "@/site.config";

export function SiteHeader() {
  return (
    <header className="border-b border-stone-200 bg-stone-50/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-xl font-semibold tracking-tight text-stone-900">
          {siteConfig.name}
        </Link>
        <nav className="flex items-center gap-4 text-sm text-stone-700">
          <Link href="/" className="transition hover:text-stone-900">
            Home
          </Link>
        </nav>
      </div>
    </header>
  );
}
