import "@testing-library/jest-dom/vitest";
import { describe, expect, test } from "vitest";
import { filterConcerts } from "./utils/concerts.js";

describe("filterConcerts", () => {
  const mockConcerts = [
    { timestamp: "2023-01-15", venue_id: "loc1", id: "abc", name: "Concert A" },
    { timestamp: "2023-02-20", venue_id: "loc2", id: "def", name: "Concert B" },
    { timestamp: "2023-03-25", venue_id: "loc1", id: "ghi", name: "Concert C" },
    { timestamp: "2023-04-30", venue_id: "loc3", id: "jkl", name: "Concert D" },
    { timestamp: "2023-05-05", venue_id: "loc2", id: "mno", name: "Concert E" },
  ] as Concert[];
  const mixedConcerts = [mockConcerts[3], mockConcerts[0], mockConcerts[1], mockConcerts[4], mockConcerts[2]];

  test("returns all concerts when no options provided", () => {
    const result = filterConcerts(mockConcerts);
    expect(result).toHaveLength(5);
    expect(result).not.toBe(mockConcerts); // Check for copy via structuredClone
  });

  test("filters concerts before a specific timestamp", () => {
    const before = new Date("2023-03-01");
    const result = filterConcerts(mockConcerts, { before });
    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBe("2023-01-15");
    expect(result[1].timestamp).toBe("2023-02-20");
  });

  test("filters concerts after a specific timestamp", () => {
    const after = new Date("2023-03-01");
    const result = filterConcerts(mockConcerts, { after });
    expect(result).toHaveLength(3);
    expect(result[0].timestamp).toBe("2023-03-25");
    expect(result[1].timestamp).toBe("2023-04-30");
    expect(result[2].timestamp).toBe("2023-05-05");
  });

  test("filters concerts by venue ID", () => {
    const result = filterConcerts(mockConcerts, { venueId: "loc1" });
    expect(result).toHaveLength(2);
    expect(result[0].venue_id).toBe("loc1");
    expect(result[1].venue_id).toBe("loc1");
  });

  test("sorts concerts by timestamp in descending order", () => {
    const result = filterConcerts(mixedConcerts, { sort: "timestamp", order: "newestFirst" });
    expect(result).toHaveLength(5);
    expect(result[0].timestamp).toBe("2023-05-05");
    expect(result[1].timestamp).toBe("2023-04-30");
    expect(result[2].timestamp).toBe("2023-03-25");
    expect(result[3].timestamp).toBe("2023-02-20");
    expect(result[4].timestamp).toBe("2023-01-15");
  });

  test("sorts concerts by timestamp in ascending order", () => {
    const result = filterConcerts(mixedConcerts, { sort: "timestamp", order: "oldestFirst" });
    expect(result).toHaveLength(5);
    expect(result[0].timestamp).toBe("2023-01-15");
    expect(result[1].timestamp).toBe("2023-02-20");
    expect(result[2].timestamp).toBe("2023-03-25");
    expect(result[3].timestamp).toBe("2023-04-30");
    expect(result[4].timestamp).toBe("2023-05-05");
  });

  test("limits the number of concerts returned", () => {
    const result = filterConcerts(mockConcerts, { limit: 2 });
    expect(result).toHaveLength(2);
  });

  test("applies offset to concerts returned", () => {
    const result = filterConcerts(mockConcerts, { offset: 3 });
    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBe("2023-04-30");
  });

  test("offsets and limits concerts returned", () => {
    const result = filterConcerts(mockConcerts, { offset: 1, limit: 2 });
    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBe("2023-02-20");
    expect(result[1].timestamp).toBe("2023-03-25");
  });

  test("combines multiple filters", () => {
    const after = new Date("2023-02-01");
    const before = new Date("2023-05-01");
    const result = filterConcerts(mockConcerts, {
      after,
      before,
      venueId: "loc1",
      sort: "timestamp",
      order: "desc",
    });

    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBe("2023-03-25");
  });

  test("uses 'newestFirst' as alias for 'desc'", () => {
    const result = filterConcerts(mockConcerts, { order: "newestFirst" });
    expect(result[0].timestamp).toBe("2023-05-05");
  });

  test("uses 'oldestFirst' as alias for 'asc'", () => {
    const result = filterConcerts(mockConcerts, { order: "oldestFirst" });
    expect(result[0].timestamp).toBe("2023-01-15");
  });
});
