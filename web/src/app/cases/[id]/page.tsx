"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getCase, getSimilarCases, type CaseDetail, type SearchResult } from "@/lib/api";

function DetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="skeleton h-4 w-28 mb-6" />
      <div className="skeleton h-7 w-3/4 mb-3" />
      <div className="skeleton h-4 w-1/2 mb-8" />
      <div className="skeleton h-10 w-full rounded-lg mb-8" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="mb-6">
          <div className="skeleton h-5 w-32 mb-3" />
          <div className="skeleton h-4 w-full mb-2" />
          <div className="skeleton h-4 w-full mb-2" />
          <div className="skeleton h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
        {title}
      </h3>
      <div className="text-[15px] leading-relaxed text-text">{children}</div>
    </div>
  );
}

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

  if (loading) return <DetailSkeleton />;

  if (error || !caseData) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <svg className="mx-auto mb-4 text-text-muted" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </svg>
        <p className="text-text-secondary mb-4">{error || "Case not found"}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition mb-6"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to search
      </Link>

      {/* Header */}
      <header className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-text leading-snug mb-2">
          {caseData.case_name}
        </h1>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-muted">
          <span>{caseData.citation}</span>
          <span>&middot;</span>
          <span>{caseData.year}</span>
          {caseData.bench && (
            <>
              <span>&middot;</span>
              <span>{caseData.bench}</span>
            </>
          )}
        </div>
      </header>

      {/* AI Disclaimer */}
      <div className="flex items-start gap-2.5 px-4 py-3 mb-8 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-700">
        <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <circle cx="12" cy="12" r="10" />
        </svg>
        <span>AI-generated summary. Always verify against the official judgment.</span>
      </div>

      {/* Case Content */}
      <div className="bg-surface rounded-xl border border-border p-5 sm:p-6 mb-8">
        {caseData.facts && (
          <SectionBlock title="Facts">
            <p>{caseData.facts}</p>
          </SectionBlock>
        )}
        {caseData.legal_issues && (
          <SectionBlock title="Legal Issues">
            <p>{caseData.legal_issues}</p>
          </SectionBlock>
        )}
        {caseData.judgment && (
          <SectionBlock title="Judgment">
            <p>{caseData.judgment}</p>
          </SectionBlock>
        )}
        {caseData.ratio_decidendi && (
          <SectionBlock title="Ratio Decidendi">
            <p>{caseData.ratio_decidendi}</p>
          </SectionBlock>
        )}
        {caseData.key_principles && caseData.key_principles.length > 0 && (
          <SectionBlock title="Key Principles">
            <ul className="list-disc pl-5 space-y-1.5">
              {caseData.key_principles.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </SectionBlock>
        )}
      </div>

      {/* Source */}
      {caseData.source_url && (
        <div className="mb-8">
          <a
            href={caseData.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            View official judgment
          </a>
        </div>
      )}

      {/* Similar Cases */}
      {similar.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-text mb-4">Similar Cases</h2>
          <ul className="space-y-2">
            {similar.map((r) => (
              <li key={r.case.id}>
                <Link
                  href={`/cases/${r.case.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 bg-surface rounded-lg border border-border
                             hover:border-primary-300 hover:shadow-sm transition group"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-text group-hover:text-primary-700 transition-colors truncate">
                      {r.case.case_name}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {r.case.citation} &middot; {r.case.year}
                    </p>
                  </div>
                  {r.similarity != null && (
                    <span className="shrink-0 text-xs text-text-muted">
                      {Math.round(r.similarity * 100)}%
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
