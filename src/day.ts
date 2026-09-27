/**
 * Handles day operations.
 *
 * This module contains the Day class, which
 * provides methods for reading and processing
 * information from a JSON file, only used
 * when there is school right now.
 */
import rawSchedule from "./data/schedule.json";

interface Schedule {
  A: [number, number];
  B: [number, number];
  C: [number, number];
  Lunch: [number, number];
  D: [number, number];
  E: [number, number];
}

type DayTypes = "Regular" | "Early Dismissal" | "Spirit Week";

class DayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DayError";
  }
}

export default class Day {
  public schedule: Schedule;
  public milliseconds: number;
  public start: number;
  public end: number;

  constructor(dayType: DayTypes) {
    const now = new Date();
    this.milliseconds =
      now.getHours() * 60 * 60 * 1000 +
      now.getMinutes() * 60 * 1000 +
      now.getSeconds() * 1000 +
      now.getMilliseconds();

    try {
      this.schedule = rawSchedule[dayType] as Schedule;
    } catch (error) {
      throw new DayError(`Day type "${dayType}" definition not found in schedule.`);
    }

    const firstSlot = Object.values(this.schedule).at(0);
    const lastSlot = Object.values(this.schedule).at(-1);

    this.start = firstSlot[0];
    this.end = lastSlot[1];
  }

  freeze(milliseconds: number) {
    this.milliseconds = milliseconds;
  }

  getCurrentSlot(): keyof Schedule | undefined {
    const slot = // Assert this directly since TypeScript won't infer it
      (Object.entries(this.schedule) as [keyof Schedule, Schedule[keyof Schedule]][]).find(
        ([_, item]) => {
          return item[0] < this.milliseconds && item[1] > this.milliseconds;
        }
      )?.[0];

    return slot;
  }

  getTimeUntilClassEnds(): number {
    const currentSlot = this.getCurrentSlot();
    if (currentSlot === undefined) {
      throw new DayError("Cannot find current slot.");
    }

    const classEnd = this.schedule[currentSlot][0];
    return classEnd - this.milliseconds;
  }

  getTimeUntilSchoolEnds(): number {
    return this.end - this.milliseconds;
  }

  getTotalSchoolTime(): number {
    return this.end - this.start;
  }
}
