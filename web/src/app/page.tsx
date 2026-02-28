"use client";

import { useState } from "react";
import Link from "next/link";
import { searchCases, getTopics, type SearchResult, type Topic } from "@/lib/api";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [yearFrom, setYearFrom] = useState<string>("");
  const [yearTo, setYearTo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchCases({
        q: query || undefined,
        topic_ids: selectedTopic || undefined,
        year_from: yearFrom ? parseInt(yearFrom) : undefined,
        year_to: yearTo ? parseInt(yearTo) : undefined,
      });
      setResults(data);
    } catch (e) {
      setResults([]);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async () => {
    try {
      const t = await getTopics();
      setTopics(t);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>
          Supreme Court AI Case Explorer
        </h1>
        <p style={{ color: "#666", fontSize: 14 }}>
          Semantic search for Indian Supreme Court landmark cases
        </p>
      </header>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            placeholder="e.g. Right to privacy, Basic structure doctrine..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            style={{
              flex: 1,
              padding: "12px 16px",
              fontSize: 16,
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: "12px 24px",
              background: "#1e40af",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <label style={{ marginRight: 8, fontSize: 14 }}>Topic:</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              onFocus={topics.length === 0 ? loadTopics : undefined}
              style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc" }}
            >
              <option value="">All topics</option>
              {topics.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ marginRight: 8, fontSize: 14 }}>Year from:</label>
            <input
              type="number"
              placeholder="e.g. 1950"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              style={{
                width: 100,
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            />
          </div>
          <div>
            <label style={{ marginRight: 8, fontSize: 14 }}>Year to:</label>
            <input
              type="number"
              placeholder="e.g. 2020"
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              style={{
                width: 100,
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            />
          </div>
        </div>
      </div>

      {searched && results !== null && (
        <section>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>
            {results.length} result{results.length !== 1 ? "s" : ""}
          </h2>
          {results.length === 0 ? (
            <p style={{ color: "#666" }}>No cases found. Try a different query.</p>
          ) : (
            <ul style={{ listStyle: "none" }}>
              {results.map((r) => (
                <li
                  key={r.case.id}
                  style={{
                    padding: 16,
                    marginBottom: 12,
                    background: "white",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <Link href={`/cases/${r.case.id}`} style={{ fontWeight: 600, fontSize: 16 }}>
                    {r.case.case_name}
                  </Link>
                  <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                    {r.case.citation} · {r.case.year}
                    {r.similarity != null && (
                      <span style={{ marginLeft: 8 }}>({Math.round(r.similarity * 100)}% match)</span>
                    )}
                  </div>
                  {r.case.snippet && (
                    <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>{r.case.snippet}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
