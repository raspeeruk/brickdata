"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postcodeToSlug } from "@/lib/postcodes";

export function SearchBar({ size = "large" }: { size?: "large" | "compact" }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    // Detect if it looks like a postcode (letters + numbers, 5-8 chars)
    const isPostcode = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(trimmed);

    if (isPostcode) {
      router.push(`/${postcodeToSlug(trimmed)}`);
    } else {
      // Treat as address search — redirect to search results page
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  const isLarge = size === "large";

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div
        className={`flex border border-bd-grid-strong bg-bd-surface ${
          isLarge ? "h-14" : "h-10"
        }`}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a postcode or address..."
          className={`flex-1 bg-transparent px-4 font-mono text-bd-text placeholder:text-bd-text-secondary/60 focus:outline-none ${
            isLarge ? "text-lg" : "text-sm"
          }`}
        />
        <button
          type="submit"
          className={`bg-bd-orange text-white font-body font-medium hover:bg-bd-orange-light transition-colors ${
            isLarge ? "px-6 text-base" : "px-4 text-sm"
          }`}
        >
          Search
        </button>
      </div>
      <p className="mt-2 text-xs text-bd-text-secondary font-mono">
        e.g. SW1A 2AA, 10 Downing Street, or any UK postcode
      </p>
    </form>
  );
}
