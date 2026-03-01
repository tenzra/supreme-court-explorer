import type { CaseSummary, CaseDetail, Topic, SearchResult } from "@shared/types";

export type { CaseSummary, CaseDetail, Topic, SearchResult };

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function searchCases(params: {
  q?: string;
  topic_ids?: string;
  year_from?: number;
  year_to?: number;
  limit?: number;
  offset?: number;
}): Promise<SearchResult[]> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.topic_ids) sp.set("topic_ids", params.topic_ids);
  if (params.year_from != null) sp.set("year_from", String(params.year_from));
  if (params.year_to != null) sp.set("year_to", String(params.year_to));
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.offset) sp.set("offset", String(params.offset));
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

export async function browseCases(params: {
  topic_ids?: string;
  year_from?: number;
  year_to?: number;
  limit?: number;
  offset?: number;
}): Promise<CaseSummary[]> {
  const sp = new URLSearchParams();
  if (params.topic_ids) sp.set("topic_ids", params.topic_ids);
  if (params.year_from != null) sp.set("year_from", String(params.year_from));
  if (params.year_to != null) sp.set("year_to", String(params.year_to));
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.offset) sp.set("offset", String(params.offset));
  const res = await fetch(`${API_BASE}/cases?${sp}`);
  if (!res.ok) throw new Error("Browse failed");
  return res.json();
}
