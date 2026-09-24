import { describe, expect, test } from "vitest";
import Calendar, { CalendarObject } from "./calendar";
import calendarData from "../public/calendars/gci.json";

const calendar = new Calendar(
  // This value will be provided by the imported json data
  "gci",
  [8.5 * 60 * 60 * 1000, 14.5 * 60 * 60 * 1000],
  [8.5 * 60 * 60 * 1000, 15.5 * 60 * 60 * 1000]
);

// 2026 9 15, 3pm 30
calendar.freeze(1789461000000);
calendar._calendar = calendarData as CalendarObject;

describe("Timestamp to string formatter", () => {
  test("Returns an ordered timestamp for an arbitrary day", () => {
    expect(calendar.strftime(calendar.now)).toBe("2026-09-15");
  });

  test("Returns correct timestamp for Unix Epoch", () => {
    expect(calendar.strftime(1)).toBe("1969-12-31");
  });
});

describe("Last day fetcher", () => {
  test("Returns correct last day", () => {
    // 2027 6 21, 3pm 30
    expect(calendar.getLastDay(-1)).toBe(1813609800000);
  });
});
