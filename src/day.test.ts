import { afterEach, describe, expect, test, vi } from "vitest";
import Day from "./day";

afterEach(() => vi.useRealTimers());

describe("Day countdowns", () => {
  test.each([
    ["Regular", 7],
    ["Early Dismissal", 6],
    ["Spirit Week", 6],
  ] as const)("%s uses the full configured school duration", (kind, hours) => {
    const day = new Day(kind);
    expect(day.start).toBe(8.5 * 60 * 60 * 1000);
    expect(day.getTotalSchoolTime()).toBe(hours * 60 * 60 * 1000);
  });

  test("reads local time including fractional seconds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 15, 9, 10, 11, 123));
    const day = new Day("Regular");
    expect(day.milliseconds).toBe(9 * 3600000 + 10 * 60000 + 11123);
  });

  test("freezing time determines the current class and remaining durations", () => {
    const day = new Day("Regular");
    day.freeze(9 * 3600000);
    expect(day.getCurrentSlot()).toBe("A");
    expect(day.getTimeUntilClassEnds()).toBe(40 * 60000);
    expect(day.getTimeUntilSchoolEnds()).toBe(6.5 * 3600000);
    day.freeze(14.5 * 3600000);
    expect(day.getCurrentSlot()).toBe("E");
    expect(day.getTimeUntilClassEnds()).toBe(3600000);
  });

  test("outside school hours there is no class countdown", () => {
    const day = new Day("Regular");
    day.freeze(7 * 3600000);
    expect(day.getCurrentSlot()).toBeUndefined();
    expect(() => day.getTimeUntilClassEnds()).toThrow("Cannot find current class slot.");
  });
});
