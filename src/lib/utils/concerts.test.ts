import { describe, expect, it } from "vitest";
import { filterConcerts } from "./concerts";

describe("filterConcerts", () => {
  // We have to use `any` here because the mock data does not match the actual Concert type
  // ! Also note, that `filterConcerts` automatically sorts the array by timestamp in descending order BY DEFAULT! So [1, 2, 3, 4] will become [4, 3, 2, 1] is not otherwise specified.
  const mockConcerts = [
    { id: "1", name: "Concert 1", type: "public", venue_id: "venue1", timestamp: "2024-01-01T10:00:00Z" },
    { id: "2", name: "Concert 2", type: "closed", venue_id: "venue2", timestamp: "2024-01-02T12:00:00Z" },
    { id: "3", name: "Concert 3", type: "public", venue_id: "venue1", timestamp: "2024-01-03T14:00:00Z" },
    { id: "4", name: "Concert 4", type: "public", venue_id: "venue3", timestamp: "2024-01-04T16:00:00Z" },
  ] as any[];

  it("should return all concerts when no options provided", () => {
    const result = filterConcerts(mockConcerts);
    expect(result).toHaveLength(4);
    expect(result).not.toBe(mockConcerts); // Should be a clone
  });

  it("should filter concerts before a specific date", () => {
    const result = filterConcerts(mockConcerts, { before: new Date("2024-01-03T00:00:00Z") });
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual(["2", "1"]);
  });

  it("should filter concerts after a specific date", () => {
    const result = filterConcerts(mockConcerts, { after: new Date("2024-01-02T12:00:00Z") });
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual(["4", "3"]);
  });

  it("should filter concerts by venue ID", () => {
    const result = filterConcerts(mockConcerts, { venueId: "venue1" });
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual(["3", "1"]);
  });

  it("should sort concerts by timestamp in ascending order", () => {
    const result = filterConcerts(mockConcerts, { order: "asc", sortBy: "timestamp" });
    expect(result.map((c) => c.id)).toEqual(["1", "2", "3", "4"]);
  });

  it("should sort concerts by timestamp in descending order", () => {
    const result = filterConcerts(mockConcerts, { order: "desc", sortBy: "timestamp" });
    expect(result.map((c) => c.id)).toEqual(["4", "3", "2", "1"]);
  });

  it("should sort by oldest first (asc)", () => {
    const result = filterConcerts(mockConcerts, { order: "oldestFirst", sortBy: "timestamp" });
    expect(result.map((c) => c.id)).toEqual(["1", "2", "3", "4"]);
  });

  it("should sort by newest first (desc)", () => {
    const result = filterConcerts(mockConcerts, { order: "newestFirst", sortBy: "timestamp" });
    expect(result.map((c) => c.id)).toEqual(["4", "3", "2", "1"]);
  });

  it("should default to sorting by newest first", () => {
    const result = filterConcerts(mockConcerts, { sortBy: "timestamp" });
    expect(result.map((c) => c.id)).toEqual(["4", "3", "2", "1"]);
  });

  it("should apply offset correctly", () => {
    const result = filterConcerts(mockConcerts, { offset: 2 });
    expect(result).toHaveLength(2);
    // The first two concerts should be skipped, remember that the array is sorted by timestamp in descending order by default
    expect(result.map((c) => c.id)).toEqual(["2", "1"]);
  });

  it("should apply limit correctly", () => {
    const result = filterConcerts(mockConcerts, { limit: 2 });
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual(["4", "3"]);
  });

  it("should combine multiple filters", () => {
    const result = filterConcerts(mockConcerts, {
      venueId: "venue1",
      order: "desc",
      limit: 1,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });

  it("should handle empty concert array", () => {
    const result = filterConcerts([]);
    expect(result).toEqual([]);
  });

  it("should handle offset larger than array length", () => {
    const result = filterConcerts(mockConcerts, { offset: 10 });
    expect(result).toEqual([]);
  });
});
