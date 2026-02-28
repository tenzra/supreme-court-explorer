/**
 * Shared types for web and mobile clients.
 * Can be imported by both projects for consistency.
 */

export interface CaseSummary {
  id: number;
  case_name: string;
  citation: string;
  year: number;
  bench: string | null;
  snippet: string | null;
  similarity?: number | null;
}

export interface CaseDetail {
  id: number;
  case_name: string;
  citation: string;
  year: number;
  bench: string | null;
  facts: string | null;
  legal_issues: string | null;
  judgment: string | null;
  ratio_decidendi: string | null;
  key_principles: string[];
  source_url: string | null;
}

export interface Topic {
  id: number;
  name: string;
  slug: string;
}

export interface SearchResult {
  case: CaseSummary;
  similarity: number | null;
}
