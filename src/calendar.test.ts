import { describe, expect, test } from "vitest";
import Calendar, { CalendarObject } from "./calendar";
import calendarData from "../public/calendars/gci.json";

const calendar = new Calendar(
  // This value will be provided by the imported json data
  "gci",
  [8.5 * 60 * 60 * 1000, 14.5 * 60 * 60 * 1000],
  [8.5 * 60 * 60 * 1000, 15.5 * 60 * 60 * 1000]
);

const currentDate = new Date("2026-09-15T15:30:00.000-05:00");

calendar.freeze(currentDate.getTime());
calendar._calendar = calendarData as CalendarObject;

describe("Timestamp to string formatter", () => {
  test("Returns an ordered timestamp for an arbitrary day", () => {
    // Convert timezones manually
    expect(calendar.strftime(calendar.now + 5 * 60 * 60 * 1000)).toBe("2026-09-15");
  });

  test("Returns correct timestamp for Unix Epoch", () => {
    const epoch = new Date("1970-01-01T00:00:00.000-05:00");
    // Convert timezones manually
    expect(calendar.strftime(epoch.getTime() + 5 * 60 * 60 * 1000)).toBe("1970-01-01");
  });
});

describe("Last day fetcher", () => {
  test("Returns correct last day", () => {
    const lastDay = new Date("2027-06-21T15:30:00.000-05:00");
    expect(calendar.getLastDay(-1)).toBe(lastDay.getTime());
  });
});

describe("School time calculator", () => {
  test("Returns correct school times", () => {
    let currentDate: Date;
    let targetDate: Date;

    // Case 1: end of school
    let target: number = calendar.getLastDay(-1);

    currentDate = new Date("2027-06-16T09:00:00.000-05:00");
    calendar.freeze(currentDate.getTime());
    expect(calendar.getSchoolTimeTo(target)).toBe(99000000);

    currentDate = new Date("2027-06-21T15:29:59.999-05:00");
    calendar.freeze(currentDate.getTime());
    expect(calendar.getSchoolTimeTo(target)).toBe(1);

    currentDate = new Date("2026-09-09T00:00:00.000-05:00");
    calendar.freeze(currentDate.getTime());
    expect(calendar.getSchoolTimeTo(target)).toBe(4226400000);

    // Case 2: random
    targetDate = new Date("2027-01-04T22:30:00.000-05:00");
    target = targetDate.getTime();

    currentDate = new Date("2027-01-01T08:30:00.000-05:00");
    calendar.freeze(currentDate.getTime());
    expect(calendar.getSchoolTimeTo(target)).toBe(25200000);

    currentDate = new Date("2026-09-26T10:30:00.000-05:00");
    calendar.freeze(currentDate.getTime());
    expect(calendar.getSchoolTimeTo(target)).toBe(1328400000);

    currentDate = new Date("2026-11-11T11:11:11.000-05:00");
    calendar.freeze(currentDate.getTime());
    expect(calendar.getSchoolTimeTo(target)).toBe(626400000);
  });

  test("Returns correct school times for optional parameters", () => {
    let currentDate: Date;
    const target = calendar.getLastDay(-1);

    currentDate = new Date("2027-06-16T09:00:00.000-05:00");
    expect(calendar.getSchoolTimeTo(target, currentDate.getTime())).toBe(99000000);
  });
});

describe("Total time calculator", () => {
  test("Returns correct total times", () => {
    let currentDate: Date;
    let targetDate: Date;
    let target: number;

    targetDate = new Date("2027-01-04T22:30:00.000-05:00");
    target = targetDate.getTime();

    currentDate = new Date("2027-01-01T08:30:00.000-05:00");
    calendar.freeze(currentDate.getTime());
    expect(calendar.getAbsoluteTimeTo(target)).toBe(309600000);

    currentDate = new Date("2026-09-26T10:30:00.000-05:00");
    calendar.freeze(currentDate.getTime());
    expect(calendar.getAbsoluteTimeTo(target)).toBe(8683200000);

    currentDate = new Date("2026-11-11T11:11:11.000-05:00");
    calendar.freeze(currentDate.getTime());
    expect(calendar.getAbsoluteTimeTo(target)).toBe(4706329000);
  });
});
