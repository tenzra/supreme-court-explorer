import { Platform } from "react-native";

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android" ? "http://10.0.2.2:8000/api" : "http://localhost:8000/api");

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

export async function searchCases(params: {
  q?: string;
  topic_ids?: string;
  year_from?: number;
  year_to?: number;
}): Promise<SearchResult[]> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.topic_ids) sp.set("topic_ids", params.topic_ids);
  if (params.year_from != null) sp.set("year_from", String(params.year_from));
  if (params.year_to != null) sp.set("year_to", String(params.year_to));
  const res = await fetch(`${API_BASE}/search?${sp}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export async function getCase(id: number): Promise<CaseDetail> {
  const res = await fetch(`${API_BASE}/cases/${id}`);
  if (!res.ok) throw new Error("Case not found");
  return res.json();
}

export async function getSimilarCases(id: number, limit = 5): Promise<SearchResult[]> {
  const res = await fetch(`${API_BASE}/cases/${id}/similar?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch similar cases");
  return res.json();
}

export async function getTopics(): Promise<Topic[]> {
  const res = await fetch(`${API_BASE}/topics`);
  if (!res.ok) throw new Error("Failed to fetch topics");
  return res.json();
}
