import { searchCases, getCase, getSimilarCases, getTopics, browseCases } from "../api";

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("searchCases", () => {
  it("calls /search with query params", async () => {
    const payload = [{ case: { id: 1, case_name: "X" }, similarity: 0.9 }];
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(payload) });

    const result = await searchCases({ q: "privacy", limit: 5 });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/search?");
    expect(url).toContain("q=privacy");
    expect(url).toContain("limit=5");
    expect(result).toEqual(payload);
  });

  it("omits undefined params", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    await searchCases({});
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).not.toContain("q=");
    expect(url).not.toContain("topic_ids=");
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });
    await expect(searchCases({ q: "test" })).rejects.toThrow("Search failed");
  });
});

describe("getCase", () => {
  it("fetches case by id", async () => {
    const detail = { id: 42, case_name: "Test v. State" };
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(detail) });

    const result = await getCase(42);
    expect(mockFetch.mock.calls[0][0]).toContain("/cases/42");
    expect(result.id).toBe(42);
  });

  it("throws on 404", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 });
    await expect(getCase(999)).rejects.toThrow("Case not found");
  });
});

describe("getSimilarCases", () => {
  it("fetches similar cases with limit", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    await getSimilarCases(1, 3);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/cases/1/similar?limit=3");
  });

  it("defaults limit to 5", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    await getSimilarCases(1);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("limit=5");
  });
});

describe("getTopics", () => {
  it("fetches all topics", async () => {
    const topics = [{ id: 1, name: "Law", slug: "law" }];
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(topics) });

    const result = await getTopics();
    expect(mockFetch.mock.calls[0][0]).toContain("/topics");
    expect(result).toEqual(topics);
  });
});

describe("browseCases", () => {
  it("calls /cases with filter params", async () => {
    const cases = [{ id: 1, case_name: "X" }];
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(cases) });

    await browseCases({ year_from: 2000, year_to: 2020, limit: 10 });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/cases?");
    expect(url).toContain("year_from=2000");
    expect(url).toContain("year_to=2020");
    expect(url).toContain("limit=10");
  });

  it("throws on failure", async () => {
    mockFetch.mockResolvedValue({ ok: false });
    await expect(browseCases({})).rejects.toThrow("Browse failed");
  });
});
