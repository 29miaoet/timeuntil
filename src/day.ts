/**
 * Handles day operations.
 *
 * This module contains the Day class, which 
 * provides methods for reading and processing 
 * information from a JSON file, only used 
 * when there is school right now.
 */
import rawSchedule from "./data/schedule.json";

interface Schedule{
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

  constructor(dayType: DayTypes) {
    try {
      this.schedule = rawSchedule[dayType] as Schedule;
    } catch (error) {
      throw new DayError(`Day type "${dayType}" definition not found in schedule.`)
    }
  }

  getSlotAt(millisecondsAfterMidnight: number): string | undefined {
    const slot = Object.entries(this.schedule).find(([slot, item]) => {
      return (
        (item[0] < millisecondsAfterMidnight) &&
        (item[1] > millisecondsAfterMidnight)
      );
    })?.[0];
    return slot;
  }
}

