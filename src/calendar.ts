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
  timeSlot: string;
  status: string;
  holidays: Array<string>;
  dayInfo: Array<string>;
}


interface CalendarObject {
  [date: string]: DayInfo;
}

export default class Calendar {
  public calendar!: CalendarObject;
  private dbPath: string;
  private startTime: number;
  private endTime: number;
  private earlyDismissalTime: Array<number>;
  private regularSchoolDayTime: Array<number>;
  public now: number;

  constructor(dbPath: string, startTime: number, endTime: number) {
    this.dbPath = dbPath;
    this.startTime = startTime;
    this.endTime = endTime;
    // 8:30 to 14:30
    this.earlyDismissalTime = [8.5*60*60*1000, 14.5*60*60*1000];
    // 8:30 to 15:40
    this.regularSchoolDayTime = [8.5*60*60*1000, (15*60 + 40)*60*1000];
    this.now = Date.now();
  }

  async loadData(): Promise<void> {
    try {
      const response = await fetch(this.dbPath);
      if (!response.ok) {
        throw new Error("Network response error " + response.statusText);
      }
      this.calendar = await response.json();
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    }
  }

  getRaw() {
    console.log(this.calendar);
  }

  strftime(timeStamp: number) {
    const date = new Date(timeStamp)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Snapshot the current time to prevent mismatches between displays
  freeze() {
    this.now = Date.now();
  }

  contains(schoolDate: number) {
    try {
      this.getDateAt(this.strftime(schoolDate));
      return true;
    } catch (RangeError) {
      return false;
    }
  }

  getAbsoluteTimeTo(timeStamp: number) {
    const absTime: number = timeStamp - this.now;
    return absTime;
  }

  getDayInfo(dateStamp: string) {
    return {
      daystatus: this.calendar[dateStamp]["status"],
      feature: this.calendar[dateStamp]["holidays"],
      event: this.calendar[dateStamp]["dayInfo"]
    }
  }

  floorTimestamp(timeUnit: string, timeStamp: number) {
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
      throw new TypeError(`Unknown time measurement unit ${timeUnit}`);
    }
    return timeObj.getTime();
  }

  modTimestamp(timeUnit: string, timeStamp: number) {
    return timeStamp - this.floorTimestamp(timeUnit, timeStamp);
  }

  getPercentCompletion(startingTimeStamp: number, endingTimeStamp: number) {
    const timeToElapse: number = endingTimeStamp - startingTimeStamp;

    // Basic safety test
    if (timeToElapse < 0) {
      throw new RangeError(`Invalid range ${startingTimeStamp}-${endingTimeStamp}`);
    }

    if (startingTimeStamp > this.now) return 0;
    if (endingTimeStamp < this.now) return 1;

    if (this.contains(this.now)) {
      // Use schoolTime
      const timeElapsed = timeToElapse - this.getSchoolTimeTo(endingTimeStamp);
      return timeElapsed / timeToElapse;
    } else {
      // Use absoluteTime
      const timeElapsed = timeToElapse - this.getAbsoluteTimeTo(endingTimeStamp);
      return timeElapsed / timeToElapse;
    }
  }

  getSchoolTimeTo(timeStamp: number) {
    const currentDate: string = this.strftime(this.now);
    const endingDate: string = this.strftime(timeStamp);
    const hoursAfterMidnight: number = this.modTimestamp("day", this.now);
    const hoursLastDay: number = this.modTimestamp("day", timeStamp);
    
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
        if (this.regularSchoolDayTime[0] <= hoursAfterMidnight &&
            hoursAfterMidnight < this.regularSchoolDayTime[1]) {
            // Subtract one day since it was already calculated above
            milliSeconds -= (this.regularSchoolDayTime[1] - this.regularSchoolDayTime[0]);
            // Add on the time that is still remaining today
            milliSeconds += (this.regularSchoolDayTime[1] - hoursAfterMidnight);
          } else if (hoursAfterMidnight < this.regularSchoolDayTime[0]) {
            // Extra day already calculated
            // Do nothing
          } else if (hoursAfterMidnight >= this.regularSchoolDayTime[1]) {
            // Subtract extra counted day
            milliSeconds -= (this.regularSchoolDayTime[1] - this.regularSchoolDayTime[0]);
          }
      }

      // Same thing as above except for early dismissal
      if (this.calendar[currentDate].timeSlot === "Early Dismissal") {
        if (this.earlyDismissalTime[0] <= hoursAfterMidnight &&
            hoursAfterMidnight < this.earlyDismissalTime[1]) {
            // Subtract one day
            milliSeconds -= (this.earlyDismissalTime[1] - this.earlyDismissalTime[0]);
            milliSeconds += (this.earlyDismissalTime[1] - hoursAfterMidnight);
          } else if (hoursAfterMidnight < this.earlyDismissalTime[0]) {
            // Do nothing
          } else if (hoursAfterMidnight >= this.earlyDismissalTime[1]) {
            // Subtract extra counted day
            milliSeconds -= (this.earlyDismissalTime[1] - this.earlyDismissalTime[0]);
          }
      }
    }


    // Correct the time remaining for the last day counted
    if (this.calendar[endingDate].hasSchool) {
      if (this.calendar[endingDate].timeSlot === "Regular") {
        // If there is school right now
        if (this.regularSchoolDayTime[0] <= hoursLastDay &&
            hoursLastDay < this.regularSchoolDayTime[1]) {
            // Subtract one day since it was already calculated above
            milliSeconds -= (this.regularSchoolDayTime[1] - this.regularSchoolDayTime[0]);
            // Add on the time that has passed today
            milliSeconds += (hoursLastDay - this.regularSchoolDayTime[0]);
          } else if (hoursLastDay < this.regularSchoolDayTime[0]) {
            // Subtract extra counted day
            milliSeconds -= (this.regularSchoolDayTime[1] - this.regularSchoolDayTime[0]);
          } else if (hoursLastDay >= this.regularSchoolDayTime[1]) {
            // Extra day already calculated
            // Do nothing
          }
      }

      // Same thing as above except for early dismissal
      if (this.calendar[endingDate].timeSlot === "Early Dismissal") {
        if (this.earlyDismissalTime[0] <= hoursLastDay &&
            hoursLastDay < this.earlyDismissalTime[1]) {
            // Subtract one day
            milliSeconds -= (this.earlyDismissalTime[1] - this.earlyDismissalTime[0]);
            milliSeconds += (hoursLastDay - this.earlyDismissalTime[0]);
          } else if (hoursLastDay < this.earlyDismissalTime[0]) {
            // Subtract extra counted day
            milliSeconds -= (this.earlyDismissalTime[1] - this.earlyDismissalTime[0]);
          } else if (hoursLastDay >= this.earlyDismissalTime[1]) {
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
  getSchoolTimeAsDate(endingDate: string) {
    type schoolDateTuple = [number, number, number, number, number];
    let schoolDateRemaining: schoolDateTuple = [0, 0, 0, 0, 0];
    let milliseconds = 0;

    const currentDate: string = this.strftime(this.now);
    const hoursAfterMidnight: number = this.modTimestamp("day", this.now);

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
    if (this.calendar[hasSchool]) {
      if (this.calendar[currentDate].timeSlot === "Regular") {
        if (this.regularSchoolDayTime[0] <= hoursAfterMidnight &&
            hoursAfterMidnight < this.regularSchoolDayTime[1]) {
            milliseconds += (this.regularSchoolDayTime[1] - hoursAfterMidnight);

          } else if (hoursAfterMidnight < this.regularSchoolDayTime[0]) {
            milliSeconds += (this.regularSchoolDayTime[1] - this.regularSchoolDayTime[0]);

          } else if (hoursAfterMidnight >= this.regularSchoolDayTime[1]) {
            // Do nothing
          }
      }

      if (this.calendar[currentDate].timeSlot === "Early Dismissal") {
        if (this.earlyDismissalTime[0] <= hoursAfterMidnight &&
            hoursAfterMidnight < this.earlyDismissalTime[1]) {
            milliseconds += (this.earlyDismissalTime[1] - hoursAfterMidnight);

          } else if (hoursAfterMidnight < this.earlyDismissalTime[0]) {
            milliSeconds += (this.earlyDismissalTime[1] - this.earlyDismissalTime[0]);

          } else if (hoursAfterMidnight >= this.earlyDismissalTime[1]) {
            // Do nothing
          }
      }
    }

    // Format milliseconds into array
    const hours = Math.floor(milliseconds/1000/60/60);
    const minutes = Math.floor((milliseconds - hours*1000*60*60)/1000/60);
    const seconds = Math.floor((milliseconds - hours*1000*60*60 - minutes*1000*60)/1000);
    const milliseconds2 = milliseconds - hours*1000*60*60 - minutes*1000*60 - seconds*1000;

    schoolDateRemaining[1] = hours;
    schoolDateRemaining[2] = minutes;
    schoolDateRemaining[3] = seconds;
    schoolDateRemaining[4] = milliseconds2;

    return schoolDateRemaining;

  }


  getDateAt(dateStamp: string) {
    if (!this.calendar[dateStamp]) {
      throw new RangeError(`Calendar does not contain ${dateStamp}.`);
    }
    return this.calendar[dateStamp];
  }
}

/*
async function start() {
  const cal = new Calendar("calendar.json", 0, 0);
  await cal.loadData();
  const tempdate = new Date(2026, 8, 22, 18, 0);
  const tempnow = new Date(2026, 8, 22, 9, 0);
  cal.now = tempnow.getTime();
  console.log(cal.getSchoolTimeTo(tempdate.getTime()));
  console.log(cal.getAbsoluteTimeTo(tempdate.getTime()));
}

start();
*/
