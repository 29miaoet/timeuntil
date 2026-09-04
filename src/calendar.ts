/**
 * Handles calendar operations.
 *
 * This module contains the Calendar class, which provides methods
 * for operating on a calendar JSON file. The file must first be
 * loaded with calendar.loadData(), the file path must be
 * provided in the constructor.
 */

interface DayInfo {
  date: string;
  hasSchool: boolean;
  timeSlot: "Regular" | "Early Dismissal";
  status: "Normal School Day" | "No School" | "Early Dismissal";
  holidays: Array<string>;
  dayInfo: Array<string>;
}

interface CalendarObject {
  [date: string]: DayInfo;
}

interface DayInfoStruct {
  daystatus: string;
  feature: Array<string>;
  event: Array<string>;
}

type FixedTime = readonly [number, number];
type SchoolTimeAsDateStruct = [number, number, number, number, number];
type TimeUnitType = "day" | "hour" | "minute" | "second";
type SchoolDateTuple = [number, number, number, number, number];
type TermEndSpecification = [number, number, number, number, number];

class CalendarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalendarError";
  }
}

export default class Calendar {
  public _calendar!: CalendarObject;
  public _lastDay!: number | null;
  private dbPath: string;
  private earlyDismissalTime: FixedTime;
  private regularSchoolDayTime: FixedTime;
  public now: number;

  constructor(dbPath: string, earlyDismissalTime: FixedTime, regularSchoolDayTime: FixedTime) {
    this.dbPath = dbPath;
    this.earlyDismissalTime = earlyDismissalTime;
    this.regularSchoolDayTime = regularSchoolDayTime;
    this.now = Date.now();
  }

  /**
   * Loads data using fetch from an external JSON file, data
   * format must match type `dayInfo`.
   */
  async loadData(): Promise<void> {
    try {
      const response = await fetch(this.dbPath);
      if (!response.ok) {
        throw new CalendarError("Network response error" + response.statusText);
      }
      this.calendar = await response.json();
      this.lastDay = this.getLastDay(-1);
    } catch (error) {
      throw new CalendarError("Calendar fetch error.");
    }
  }

  /**
   * This function must be called with an index to check first
   * as a parameter, preferably -1. It should only be used once
   * inside loadDate(), to prevent unnecessary calculation; to
   * get the last day of school, reference the `this.lastDay`
   * variable.
   */
  getLastDay(indexToCheckFirst: number): number {
    const day = Object.values(this.calendar).at(indexToCheckFirst);
    if (!day) {
      throw new CalendarError("Could not find last school day.");
    }

    if (day.hasSchool) {
      const foundDate = new Date(day.date);
      if (day.timeSlot === "Regular") {
        foundDate.setMilliseconds(this.regularSchoolDayTime[1]);
      } else if (day.timeSlot === "Early Dismissal") {
        foundDate.setMilliseconds(this.earlyDismissalTime[1]);
      }
      return foundDate.getTime();
    } else {
      return this.getLastDay(--indexToCheckFirst);
    }
  }

  // Check whether calendar has been loaded.
  get calendar(): CalendarObject {
    if (!this._calendar) {
      throw new CalendarError("No calendar loaded, did you forget to call loadData()?");
    }
    return this._calendar;
  }

  private set calendar(data: CalendarObject) {
    this._calendar = data;
  }

  get lastDay(): number {
    if (!this._lastDay) {
      throw new CalendarError(
        "Last day of school not found, this may be due to failing to load a valid calendar."
      );
    }
    return this._lastDay;
  }

  private set lastDay(data: number) {
    this._lastDay = data;
  }

  /**
   * This method should only be used in debugging and not in production code.
   */
  getRaw() {
    console.log(this.calendar);
  }

  strftime(timeStamp: number): string {
    const date = new Date(timeStamp);
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Snapshot the current time to prevent mismatches between displays
  freeze() {
    this.now = Date.now();
  }

  contains(schoolDate: number): boolean {
    try {
      this.getDateAt(this.strftime(schoolDate));
      return true;
    } catch (e) {
      return false;
    }
  }

  schoolNow(): boolean {
    const currentDate = this.strftime(this.now);
    if (!this.calendar[currentDate].hasSchool) {
      return false;
    } else if (this.calendar[currentDate].timeSlot === "Regular") {
      return this.regularSchoolDayTime[0] < this.now && this.regularSchoolDayTime[1] > this.now;
    } else if (this.calendar[currentDate].timeSlot === "Early Dismissal") {
      return this.earlyDismissalTime[0] < this.now && this.earlyDismissalTime[1] > this.now;
    }
    return false;
  }

  getAbsoluteTimeTo(timeStamp: number): number {
    const absTime = timeStamp - this.now;
    return absTime;
  }

  getDayInfo(dateStamp: string): DayInfoStruct {
    return {
      daystatus: this.calendar[dateStamp]["status"],
      feature: this.calendar[dateStamp]["holidays"],
      event: this.calendar[dateStamp]["dayInfo"],
    };
  }

  floorTimestamp(timeUnit: TimeUnitType, timeStamp: number): number {
    const timeObj = new Date(timeStamp);
    if (timeUnit === "second") {
      timeObj.setMilliseconds(0);
    } else if (timeUnit === "minute") {
      timeObj.setMilliseconds(0);
      timeObj.setSeconds(0);
    } else if (timeUnit === "hour") {
      timeObj.setMilliseconds(0);
      timeObj.setSeconds(0);
      timeObj.setMinutes(0);
    } else if (timeUnit === "day") {
      timeObj.setMilliseconds(0);
      timeObj.setSeconds(0);
      timeObj.setMinutes(0);
      timeObj.setHours(0);
    } else {
      throw new CalendarError(`Unknown time measurement unit ${timeUnit}`);
    }
    return timeObj.getTime();
  }

  modTimestamp(timeUnit: TimeUnitType, timeStamp: number): number {
    return timeStamp - this.floorTimestamp(timeUnit, timeStamp);
  }

  getPercentCompletion(startingTimeStamp: number, endingTimeStamp: number): number {
    const timeToElapse = endingTimeStamp - startingTimeStamp;

    // Basic safety test
    if (timeToElapse < 0) {
      throw new CalendarError(`Invalid range ${startingTimeStamp} - ${endingTimeStamp}`);
    }

    if (startingTimeStamp > this.now) return 0;
    if (endingTimeStamp < this.now) return 1;

    const schoolTimeToElapse = this.getSchoolTimeTo(endingTimeStamp, startingTimeStamp);

    if (this.contains(this.now)) {
      // Use schoolTime
      const timeElapsed = schoolTimeToElapse - this.getSchoolTimeTo(endingTimeStamp);
      return timeElapsed / timeToElapse;
    } else {
      // Use absoluteTime
      const timeElapsed = timeToElapse - this.getAbsoluteTimeTo(endingTimeStamp);
      return timeElapsed / timeToElapse;
    }
  }

  /**
   * This method takes two arguments, the timeStamp parameter represents the target
   * to which the school time to will be calculated, the second parameter, which is
   * optional, represents the time where the function should take as it's starting
   * time. Please take note that the FIRST parameter is the ending time, and the
   * SECOND is the starting time.
   */
  getSchoolTimeTo(timeStamp: number, startingTime: number = this.now): number {
    const currentDate = this.strftime(startingTime);
    const endingDate = this.strftime(timeStamp);
    const millisecondsAfterMidnight = this.modTimestamp("day", startingTime);
    const millisecondsLastDay = this.modTimestamp("day", timeStamp);

    let milliSeconds: number = 0;

    for (const date in this.calendar) {
      // Smaller or equal to & greater than or equal to
      if (date < currentDate || date > endingDate) {
        continue;
      } else {
        if (!this.calendar[date].hasSchool) {
          continue;
        } else if (this.calendar[date].timeSlot === "Early Dismissal") {
          milliSeconds += this.earlyDismissalTime[1] - this.earlyDismissalTime[0];
        } else if (this.calendar[date].timeSlot === "Regular") {
          milliSeconds += this.regularSchoolDayTime[1] - this.regularSchoolDayTime[0];
        }
      }
    }

    // Correct the time remaining for the first day counted
    if (this.calendar[currentDate].hasSchool) {
      if (this.calendar[currentDate].timeSlot === "Regular") {
        // If there is school right now
        if (
          this.regularSchoolDayTime[0] <= millisecondsAfterMidnight &&
          millisecondsAfterMidnight < this.regularSchoolDayTime[1]
        ) {
          // Subtract one day since it was already calculated above
          milliSeconds -= this.regularSchoolDayTime[1] - this.regularSchoolDayTime[0];
          // Add on the time that is still remaining today
          milliSeconds += this.regularSchoolDayTime[1] - millisecondsAfterMidnight;
        } else if (millisecondsAfterMidnight < this.regularSchoolDayTime[0]) {
          // Extra day already calculated
          // Do nothing
        } else if (millisecondsAfterMidnight >= this.regularSchoolDayTime[1]) {
          // Subtract extra counted day
          milliSeconds -= this.regularSchoolDayTime[1] - this.regularSchoolDayTime[0];
        }
      }

      // Same thing as above except for early dismissal
      if (this.calendar[currentDate].timeSlot === "Early Dismissal") {
        if (
          this.earlyDismissalTime[0] <= millisecondsAfterMidnight &&
          millisecondsAfterMidnight < this.earlyDismissalTime[1]
        ) {
          // Subtract one day
          milliSeconds -= this.earlyDismissalTime[1] - this.earlyDismissalTime[0];
          milliSeconds += this.earlyDismissalTime[1] - millisecondsAfterMidnight;
        } else if (millisecondsAfterMidnight < this.earlyDismissalTime[0]) {
          // Do nothing
        } else if (millisecondsAfterMidnight >= this.earlyDismissalTime[1]) {
          // Subtract extra counted day
          milliSeconds -= this.earlyDismissalTime[1] - this.earlyDismissalTime[0];
        }
      }
    }

    // Correct the time remaining for the last day counted
    if (this.calendar[endingDate].hasSchool) {
      if (this.calendar[endingDate].timeSlot === "Regular") {
        // If there is school right now
        if (
          this.regularSchoolDayTime[0] <= millisecondsLastDay &&
          millisecondsLastDay < this.regularSchoolDayTime[1]
        ) {
          // Subtract one day since it was already calculated above
          milliSeconds -= this.regularSchoolDayTime[1] - this.regularSchoolDayTime[0];
          // Add on the time that has passed today
          milliSeconds += millisecondsLastDay - this.regularSchoolDayTime[0];
        } else if (millisecondsLastDay < this.regularSchoolDayTime[0]) {
          // Subtract extra counted day
          milliSeconds -= this.regularSchoolDayTime[1] - this.regularSchoolDayTime[0];
        } else if (millisecondsLastDay >= this.regularSchoolDayTime[1]) {
          // Extra day already calculated
          // Do nothing
        }
      }

      // Same thing as above except for early dismissal
      if (this.calendar[endingDate].timeSlot === "Early Dismissal") {
        if (
          this.earlyDismissalTime[0] <= millisecondsLastDay &&
          millisecondsLastDay < this.earlyDismissalTime[1]
        ) {
          // Subtract one day
          milliSeconds -= this.earlyDismissalTime[1] - this.earlyDismissalTime[0];
          milliSeconds += millisecondsLastDay - this.earlyDismissalTime[0];
        } else if (millisecondsLastDay < this.earlyDismissalTime[0]) {
          // Subtract extra counted day
          milliSeconds -= this.earlyDismissalTime[1] - this.earlyDismissalTime[0];
        } else if (millisecondsLastDay >= this.earlyDismissalTime[1]) {
          // Do nothing
        }
      }
    }
    return milliSeconds;
  }

  /**
   * This method does not support a timeStamp argument,
   * only full dates, it should be updated in the
   * future to support more accurate timing.
   */
  getSchoolTimeAsDate(endingTimeStamp: number): SchoolTimeAsDateStruct {
    let endDate = new Date(endingTimeStamp);
    const endingDateObj = this.getDateAt(this.strftime(endingTimeStamp));

    // Bump ending Date back a day if it is before school actually starts
    if (endingDateObj.timeSlot === "Regular") {
      if (this.modTimestamp("day", endingTimeStamp) <= this.regularSchoolDayTime[0]) {
        endDate = new Date(endingTimeStamp - 24 * 60 * 60 * 1000);
      }
    } else if (endingDateObj.timeSlot === "Early Dismissal") {
      if (this.modTimestamp("day", endingTimeStamp) <= this.earlyDismissalTime[0]) {
        endDate = new Date(endingTimeStamp - 24 * 60 * 60 * 1000);
      }
    }

    const endingDate = this.strftime(endDate.getTime());

    let schoolDateRemaining: SchoolDateTuple = [0, 0, 0, 0, 0];
    let milliseconds: number = 0;

    const currentDate = this.strftime(this.now);
    const hoursAfterMidnight = this.modTimestamp("day", this.now);

    for (const date in this.calendar) {
      // The current date should not be counted but the ending Date should be
      if (date <= currentDate || date > endingDate) {
        continue;
      } else {
        if (!this.calendar[date].hasSchool) {
          continue;
        } else {
          schoolDateRemaining[0]++;
        }
      }
    }

    // Fix current day
    if (this.calendar[currentDate].hasSchool) {
      if (this.calendar[currentDate].timeSlot === "Regular") {
        if (
          this.regularSchoolDayTime[0] <= hoursAfterMidnight &&
          hoursAfterMidnight < this.regularSchoolDayTime[1]
        ) {
          milliseconds += this.regularSchoolDayTime[1] - hoursAfterMidnight;
        } else if (hoursAfterMidnight < this.regularSchoolDayTime[0]) {
          milliseconds += this.regularSchoolDayTime[1] - this.regularSchoolDayTime[0];
        } else if (hoursAfterMidnight >= this.regularSchoolDayTime[1]) {
          // Do nothing
        }
      }

      if (this.calendar[currentDate].timeSlot === "Early Dismissal") {
        if (
          this.earlyDismissalTime[0] <= hoursAfterMidnight &&
          hoursAfterMidnight < this.earlyDismissalTime[1]
        ) {
          milliseconds += this.earlyDismissalTime[1] - hoursAfterMidnight;
        } else if (hoursAfterMidnight < this.earlyDismissalTime[0]) {
          milliseconds += this.earlyDismissalTime[1] - this.earlyDismissalTime[0];
        } else if (hoursAfterMidnight >= this.earlyDismissalTime[1]) {
          // Do nothing
        }
      }
    }

    // Format milliseconds into array
    const hours = Math.floor(milliseconds / 1000 / 60 / 60);
    const minutes = Math.floor((milliseconds - hours * 1000 * 60 * 60) / 1000 / 60);
    const seconds = Math.floor(
      (milliseconds - hours * 1000 * 60 * 60 - minutes * 1000 * 60) / 1000
    );
    const milliseconds2 =
      milliseconds - hours * 1000 * 60 * 60 - minutes * 1000 * 60 - seconds * 1000;

    schoolDateRemaining[1] = hours;
    schoolDateRemaining[2] = minutes;
    schoolDateRemaining[3] = seconds;
    schoolDateRemaining[4] = milliseconds2;

    return schoolDateRemaining;
  }

  findNextWeekend(): number {
    const currentDate = new Date(this.now);
    const currentWeekday = currentDate.getDay();
    const tempEnd = new Date(this.floorTimestamp("day", this.now));

    if (currentWeekday === 6 || currentWeekday === 0) {
      return this.now;
    } else {
      const daysToAdd = 6 - currentDate.getDay();
      tempEnd.setDate(tempEnd.getDate() + daysToAdd);
    }

    return this.schoolTimeify(tempEnd).getTime();
  }

  getDayOfTheWeek(date: DayInfo): number {
    const d = new Date(date.date);
    return d.getDay();
  }

  findNextLongWeekend(): number {
    const day = Object.values(this.calendar).find((_day, index, array) => {
      // Use indexes for consistency
      const first = array[index];
      const second = array[index + 1];
      const third = array[index + 2];
      if (!second || !third) return false;
      const schoolNotExists = !first.hasSchool && !second?.hasSchool && !third?.hasSchool;
      const onWeekend =
        (this.getDayOfTheWeek(first) === 6 && this.getDayOfTheWeek(second) === 0) ||
        (this.getDayOfTheWeek(second) === 6 && this.getDayOfTheWeek(third) === 0);

      const dateNow = new Date(this.now);
      const dateCandidate = new Date(first.date);

      const inTheFuture = dateCandidate > dateNow;

      return schoolNotExists && onWeekend && inTheFuture;
    });

    if (!day) {
      const previousFoundDay = new Date(this.lastDay);
      return previousFoundDay.getTime();
    }
    const previousFoundDay = new Date(day.date);
    return this.schoolTimeify(previousFoundDay).getTime();
  }

  /**
   * Takes a date object as an input and returns a modified date object
   * that has hours and minutes set to the end school time of either
   * late start or early dismissal. It is the only method in this
   * class that converses in Date objects rather than timestamps.
   */
  schoolTimeify(dateObj: Date): Date {
    // Rollback to previous day
    dateObj.setDate(dateObj.getDate() - 1);
    // Add check for whether it falls on the same day as right now
    if (this.floorTimestamp("day", dateObj.getTime()) === this.floorTimestamp("day", this.now)) {
      return new Date(this.now);
    }
    const stamp = this.strftime(dateObj.getTime());

    if (this.calendar[stamp].hasSchool) {
      if (this.calendar[stamp].timeSlot === "Regular") {
        dateObj.setMilliseconds(this.regularSchoolDayTime[1]);
      } else if (this.calendar[stamp].timeSlot === "Early Dismissal") {
        dateObj.setMilliseconds(this.earlyDismissalTime[1]);
      }
    } else {
      dateObj.setHours(24);
    }

    return dateObj;
  }

  findNextNoSchool(): number {
    const day = Object.values(this.calendar).find((day) => {
      const dateNow = new Date(this.now);
      const dateCandidate = new Date(day.date);
      const inTheFuture = dateCandidate > dateNow;
      return !day.hasSchool && inTheFuture;
    });

    if (!day) {
      const previousFoundDay = new Date(this.lastDay);
      return previousFoundDay.getTime();
    }
    const foundDate = new Date(day.date);
    return this.schoolTimeify(foundDate).getTime();
  }

  /**
   * Takes any number of arrays of numbers as an argument,
   * each array must have exactly 5 numbers, to be passed on
   * to a Date object constructor, they must be valid dates.
   * and arranged in chronological order.
   */
  findEndTerm(...termEnds: Array<TermEndSpecification>): number {
    let termEndDates: Array<Date> = [];
    for (const arr of termEnds) {
      const date = new Date(...arr);
      termEndDates.push(date);
    }

    for (const date of termEndDates) {
      // First term that has not passed
      if (date.getTime() - this.now > 0) {
        return date.getTime();
      }
    }

    return this.now;
  }

  getDateAt(dateStamp: string): DayInfo {
    if (!this.calendar[dateStamp]) {
      throw new RangeError(`Calendar does not contain ${dateStamp}.`);
    }
    return this.calendar[dateStamp];
  }
}
