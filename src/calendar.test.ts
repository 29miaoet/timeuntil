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
    targetDate = new Date("2027-01-04T22:30:00.000-05:00")
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
    expect(
      calendar.getSchoolTimeTo(target, currentDate.getTime())
    ).toBe(99000000);
  });
})


describe("Total time calculator", () => {

  test("Returns correct total times", () => {
    let currentDate: Date;
    let targetDate: Date;
    let target: number;

    targetDate = new Date("2027-01-04T22:30:00.000-05:00")
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
