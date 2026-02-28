"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { searchCases, getTopics, type SearchResult, type Topic } from "@/lib/api";

const RESULTS_PER_PAGE = 10;

function SearchSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-surface rounded-xl border border-border p-5">
          <div className="skeleton h-5 w-3/4 mb-3" />
          <div className="skeleton h-4 w-1/2 mb-3" />
          <div className="skeleton h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

function SimilarityBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80
      ? "bg-green-50 text-green-700 border-green-200"
      : pct >= 60
        ? "bg-blue-50 text-primary-700 border-primary-200"
        : "bg-gray-50 text-text-secondary border-border";
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${color}`}>
      {pct}% match
    </span>
  );
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [yearFrom, setYearFrom] = useState<string>("");
  const [yearTo, setYearTo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTopics().then(setTopics).catch(() => {});
  }, []);

  const handleSearch = useCallback(
    async (pageNum = 0) => {
      setLoading(true);
      setSearched(true);
      setError(null);
      setPage(pageNum);
      try {
        const data = await searchCases({
          q: query || undefined,
          topic_ids: selectedTopic || undefined,
          year_from: yearFrom ? parseInt(yearFrom) : undefined,
          year_to: yearTo ? parseInt(yearTo) : undefined,
          limit: RESULTS_PER_PAGE,
          offset: pageNum * RESULTS_PER_PAGE,
        });
        setResults(data);
      } catch {
        setResults([]);
        setError("Search failed. Make sure the backend is running.");
      } finally {
        setLoading(false);
      }
    },
    [query, selectedTopic, yearFrom, yearTo]
  );

  const clearFilters = () => {
    setSelectedTopic("");
    setYearFrom("");
    setYearTo("");
  };

  const hasFilters = selectedTopic || yearFrom || yearTo;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Hero */}
      <header className="text-center mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">
          Explore Supreme Court Cases
        </h1>
        <p className="text-text-secondary text-sm sm:text-base max-w-lg mx-auto">
          AI-powered semantic search across landmark Indian Supreme Court decisions.
          Search by concept, legal principle, or keyword.
        </p>
      </header>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="e.g. Right to privacy, Basic structure doctrine..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(0)}
              className="w-full pl-10 pr-4 py-3 text-sm sm:text-base bg-surface border border-border rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         placeholder:text-text-muted transition"
            />
          </div>
          <button
            onClick={() => handleSearch(0)}
            disabled={loading}
            className="px-5 sm:px-6 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl
                       hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <label className="text-text-secondary font-medium whitespace-nowrap">Topic</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="px-3 py-1.5 bg-surface border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="">All topics</option>
              {topics.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-text-secondary font-medium whitespace-nowrap">From</label>
            <input
              type="number"
              placeholder="1950"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              className="w-20 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-text-secondary font-medium whitespace-nowrap">To</label>
            <input
              type="number"
              placeholder="2024"
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              className="w-20 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-text-muted hover:text-text-secondary transition cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading && <SearchSkeleton />}

      {error && !loading && (
        <div className="text-center py-10">
          <p className="text-red-600 text-sm mb-2">{error}</p>
          <button
            onClick={() => handleSearch(page)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && searched && results !== null && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-text-secondary">
              {results.length === 0
                ? "No results found"
                : `Showing ${page * RESULTS_PER_PAGE + 1}–${page * RESULTS_PER_PAGE + results.length} results`}
            </h2>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 bg-surface rounded-xl border border-border">
              <svg className="mx-auto mb-3 text-text-muted" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
                <path d="M8 11h6" />
              </svg>
              <p className="text-text-secondary text-sm">No cases matched your search.</p>
              <p className="text-text-muted text-xs mt-1">Try different keywords or broaden your filters.</p>
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {results.map((r) => (
                  <li key={r.case.id}>
                    <Link
                      href={`/cases/${r.case.id}`}
                      className="block bg-surface rounded-xl border border-border p-5
                                 hover:border-primary-300 hover:shadow-sm transition group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <h3 className="font-semibold text-text group-hover:text-primary-700 transition-colors leading-snug">
                          {r.case.case_name}
                        </h3>
                        {r.similarity != null && <SimilarityBadge value={r.similarity} />}
                      </div>
                      <p className="text-xs text-text-muted mb-2">
                        {r.case.citation} &middot; {r.case.year}
                      </p>
                      {r.case.snippet && (
                        <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
                          {r.case.snippet}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <button
                  onClick={() => handleSearch(page - 1)}
                  disabled={page === 0}
                  className="flex items-center gap-1.5 text-sm font-medium text-text-secondary
                             hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Previous
                </button>
                <span className="text-xs text-text-muted">Page {page + 1}</span>
                <button
                  onClick={() => handleSearch(page + 1)}
                  disabled={results.length < RESULTS_PER_PAGE}
                  className="flex items-center gap-1.5 text-sm font-medium text-text-secondary
                             hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {/* Empty state before searching */}
      {!searched && (
        <div className="text-center py-16">
          <svg className="mx-auto mb-4 text-text-muted" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            <path d="M8 7h6" />
            <path d="M8 11h8" />
          </svg>
          <p className="text-text-secondary text-sm">
            Enter a query above to search across landmark cases
          </p>
          <p className="text-text-muted text-xs mt-1">
            Or just hit Search to browse all cases
          </p>
        </div>
      )}
    </div>
  );
}
