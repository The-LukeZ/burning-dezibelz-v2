import { describe, it, expect, beforeEach } from "vitest";
import { BDSnowflake } from "./snowflake";

describe("BDSnowflake", () => {
  let snowflake: BDSnowflake;

  beforeEach(() => {
    snowflake = new BDSnowflake();
  });

  describe("constructor", () => {
    it("should create an instance with BD_EPOCH", () => {
      expect(snowflake).toBeInstanceOf(BDSnowflake);
      expect(snowflake.epoch).toEqual(BigInt(new Date("2023-01-01T00:00:00.000Z").getTime()));
    });
  });

  describe("generate", () => {
    it("should generate a valid snowflake ID", () => {
      const id = snowflake.generate();
      expect(typeof id).toBe("bigint");
      expect(id).toBeGreaterThan(BigInt(0));
    });

    it("should generate unique IDs", () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        const id = snowflake.generate();
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }
    });

    it("should generate IDs in ascending order", () => {
      const id1 = snowflake.generate();
      const id2 = snowflake.generate();
      expect(id2).toBeGreaterThan(id1);
    });
  });

  describe("deconstruct", () => {
    it("should deconstruct a snowflake ID correctly", () => {
      const id = snowflake.generate();
      const deconstructed = snowflake.deconstruct(id);

      expect(deconstructed).toHaveProperty("timestamp");
      expect(deconstructed).toHaveProperty("workerId");
      expect(deconstructed).toHaveProperty("processId");
      expect(deconstructed).toHaveProperty("increment");
    });

    it("should have timestamp after BD_EPOCH", () => {
      const id = snowflake.generate();
      const deconstructed = snowflake.deconstruct(id);
      const bdEpoch = new Date("2023-01-01T00:00:00.000Z");

      expect(deconstructed.timestamp).toBeGreaterThanOrEqual(bdEpoch.getTime());
    });
  });

  describe("timestampFrom", () => {
    it("should extract correct timestamp from snowflake", () => {
      const beforeGeneration = Date.now();
      const id = snowflake.generate();
      const afterGeneration = Date.now();

      const extractedTimestamp = snowflake.timestampFrom(id);

      expect(extractedTimestamp).toBeGreaterThanOrEqual(beforeGeneration);
      expect(extractedTimestamp).toBeLessThanOrEqual(afterGeneration);
    });
  });

  describe("edge cases", () => {
    it("should handle rapid generation without collision", async () => {
      const ids = await Promise.all(
        Array.from({ length: 1000 }, () => Promise.resolve(snowflake.generate())),
      );

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should maintain chronological order over time", () => {
      const id1 = snowflake.generate();

      setTimeout(() => {
        const id2 = snowflake.generate();
        expect(id2).toBeGreaterThan(id1);

        const timestamp1 = snowflake.timestampFrom(id1);
        const timestamp2 = snowflake.timestampFrom(id2);
        expect(timestamp2).toBeGreaterThanOrEqual(timestamp1);
      }, 10);
    });
  });
});
