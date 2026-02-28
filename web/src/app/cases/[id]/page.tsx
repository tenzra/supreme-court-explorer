"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getCase, getSimilarCases, type CaseDetail, type SearchResult } from "@/lib/api";

export default function CaseDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [similar, setSimilar] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNaN(id)) {
      setError("Invalid case ID");
      setLoading(false);
      return;
    }
    Promise.all([getCase(id), getSimilarCases(id)])
      .then(([c, s]) => {
        setCaseData(c);
        setSimilar(s);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (error || !caseData)
    return (
      <div style={{ padding: 24 }}>
        <p>{error || "Case not found"}</p>
        <Link href="/" style={{ marginTop: 16, display: "inline-block" }}>
          Back to search
        </Link>
      </div>
    );

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <Link href="/" style={{ marginBottom: 16, display: "inline-block" }}>
        ← Back to search
      </Link>

      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>{caseData.case_name}</h1>
        <p style={{ color: "#666", fontSize: 14 }}>
          {caseData.citation} · {caseData.year}
          {caseData.bench && ` · ${caseData.bench}`}
        </p>
      </header>

      <div
        style={{
          padding: 12,
          marginBottom: 24,
          background: "#fef3c7",
          borderRadius: 8,
          fontSize: 14,
        }}
      >
        AI-generated summary. Verify with official judgment.
      </div>

      <section style={{ marginBottom: 24 }}>
        {caseData.facts && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Facts</h3>
            <p style={{ lineHeight: 1.6 }}>{caseData.facts}</p>
          </div>
        )}
        {caseData.legal_issues && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Legal Issues</h3>
            <p style={{ lineHeight: 1.6 }}>{caseData.legal_issues}</p>
          </div>
        )}
        {caseData.judgment && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Judgment</h3>
            <p style={{ lineHeight: 1.6 }}>{caseData.judgment}</p>
          </div>
        )}
        {caseData.ratio_decidendi && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Ratio Decidendi</h3>
            <p style={{ lineHeight: 1.6 }}>{caseData.ratio_decidendi}</p>
          </div>
        )}
        {caseData.key_principles && caseData.key_principles.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Key Principles</h3>
            <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
              {caseData.key_principles.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {caseData.source_url && (
        <p style={{ marginBottom: 24, fontSize: 14 }}>
          <a href={caseData.source_url} target="_blank" rel="noopener noreferrer">
            View source
          </a>
        </p>
      )}

      {similar.length > 0 && (
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Similar Cases</h2>
          <ul style={{ listStyle: "none" }}>
            {similar.map((r) => (
              <li
                key={r.case.id}
                style={{
                  padding: 12,
                  marginBottom: 8,
                  background: "white",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}
              >
                <Link href={`/cases/${r.case.id}`} style={{ fontWeight: 500 }}>
                  {r.case.case_name}
                </Link>
                <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                  {r.case.citation} · {r.case.year}
                  {r.similarity != null && ` · ${Math.round(r.similarity * 100)}% similar`}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
