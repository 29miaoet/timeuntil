"use strict";
class Calendar {
    calendar;
    dbPath;
    startTime;
    endTime;
    earlyDismissalTime;
    regularSchoolDayTime;
    now;
    constructor(dbPath, startTime, endTime) {
        this.dbPath = dbPath;
        this.startTime = startTime;
        this.endTime = endTime;
        // 8:30 to 14:30
        this.earlyDismissalTime = [8.5 * 60 * 60 * 1000, 14.5 * 60 * 60 * 1000];
        // 8:30 to 15:40
        this.regularSchoolDayTime = [8.5 * 60 * 60 * 1000, (15 * 60 + 40) * 60 * 1000];
        this.now = Date.now();
    }
    async loadData() {
        try {
            const response = await fetch(this.dbPath);
            if (!response.ok) {
                throw new Error("Network response error " + response.statusText);
            }
            this.calendar = await response.json();
        }
        catch (error) {
            console.error("There was a problem with the fetch operation:", error);
        }
    }
    getRaw() {
        console.log(this.calendar);
    }
    strftime(timeStamp) {
        const date = new Date(timeStamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    // Snapshot the current time to prevent mismatches between displays
    snapshot() {
        this.now = Date.now();
    }
    getAbsoluteTimeTo(timeStamp) {
        const absTime = timeStamp - this.now;
        return absTime / 1000 / 60 / 60 / 24;
    }
    floorTimestamp(timeUnit, timeStamp) {
        const timeObj = new Date(timeStamp);
        if (timeUnit === "second") {
            timeObj.setMilliseconds(0);
        }
        else if (timeUnit === "minute") {
            timeObj.setMilliseconds(0);
            timeObj.setSeconds(0);
        }
        else if (timeUnit === "hour") {
            timeObj.setMilliseconds(0);
            timeObj.setSeconds(0);
            timeObj.setMinutes(0);
        }
        else if (timeUnit === "day") {
            timeObj.setMilliseconds(0);
            timeObj.setSeconds(0);
            timeObj.setMinutes(0);
            timeObj.setHours(0);
        }
        else {
            throw new TypeError(`Unknown time measurement unit ${timeUnit}`);
        }
        return timeObj.getTime();
    }
    modTimestamp(timeUnit, timeStamp) {
        const timeObj = new Date(timeStamp);
        let returnTime = 0;
        if (timeUnit === "second") {
            returnTime += timeObj.getMilliseconds();
        }
        else if (timeUnit === "minute") {
            returnTime += timeObj.getMilliseconds();
            returnTime += timeObj.getSeconds();
        }
        else if (timeUnit === "hour") {
            returnTime += timeObj.getMilliseconds();
            returnTime += timeObj.getSeconds();
            returnTime += timeObj.getMinutes();
        }
        else if (timeUnit === "day") {
            returnTime += timeObj.getMilliseconds();
            returnTime += timeObj.getSeconds();
            returnTime += timeObj.getMinutes();
            returnTime += timeObj.getHours();
        }
        else {
            throw new TypeError(`Unknown time measurement unit ${timeUnit}`);
        }
        return timeObj.getTime();
    }
    getSchoolTimeTo(timeStamp) {
        const currentDate = this.strftime(this.now);
        const endingDate = this.strftime(timeStamp);
        const hoursAfterMidnight = this.modTimestamp("day", this.now);
        let milliSeconds = 0;
        for (const date in this.calendar) {
            // Smaller or equal to
            if (date < currentDate || date > endingDate) {
                continue;
            }
            else {
                if (!this.calendar[date].hasSchool) {
                    continue;
                }
                else if (this.calendar[date].timeSlot === "Early Dismissal") {
                    milliSeconds += this.earlyDismissalTime[1] - this.earlyDismissalTime[0];
                }
                else if (this.calendar[date].timeSlot === "Regular") {
                    milliSeconds += this.regularSchoolDayTime[1] - this.regularSchoolDayTime[0];
                }
            }
        }
        if (this.calendar[currentDate].hasSchool) {
            if (this.calendar[currentDate].timeSlot === "Regular") {
                if (this.regularSchoolDayTime[0] < hoursAfterMidnight &&
                    hoursAfterMidnight < this.regularSchoolDayTime[1]) {
                    // Subtract one day
                    milliSeconds -= (this.regularSchoolDayTime[1] - this.regularSchoolDayTime[0]);
                    milliSeconds += (hoursAfterMidnight - this.regularSchoolDayTime[0]);
                }
                else if (hoursAfterMidnight < this.regularSchoolDayTime[0]) {
                    // Subtract extra counted day
                    milliSeconds -= (this.regularSchoolDayTime[1] - this.regularSchoolDayTime[0]);
                }
                else if (hoursAfterMidnight > this.regularSchoolDayTime[1]) {
                    // Do nothing
                }
            }
            if (this.calendar[currentDate].timeSlot === "Early Dismissal") {
                if (this.earlyDismissalTime[0] < hoursAfterMidnight &&
                    hoursAfterMidnight < this.earlyDismissalTime[1]) {
                    // Subtract one day
                    milliSeconds -= (this.earlyDismissalTime[1] - this.earlyDismissalTime[0]);
                    milliSeconds += (hoursAfterMidnight - this.earlyDismissalTime[0]);
                }
                else if (hoursAfterMidnight < this.earlyDismissalTime[0]) {
                    // Subtract extra counted day
                    milliSeconds -= (this.earlyDismissalTime[1] - this.earlyDismissalTime[0]);
                }
                else if (hoursAfterMidnight > this.earlyDismissalTime[1]) {
                    // Do nothing
                }
            }
        }
        return milliSeconds / 1000 / 60 / 60 / 24;
    }
    getDateAt(dateStamp) {
        if (!this.calendar[dateStamp]) {
            throw new RangeError(`Calendar does not contain ${dateStamp}.`);
        }
        return this.calendar[dateStamp];
    }
}
async function start() {
    const cal = new Calendar("calendar.json", 0, 0);
    await cal.loadData();
    const tempdate = new Date(2026, 11, 15, 15, 40);
    const tempnow = new Date(2026, 10, 12, 11, 22, 32);
    cal.now = tempnow.getTime();
    console.log(cal.getSchoolTimeTo(tempdate.getTime()));
    console.log(cal.getAbsoluteTimeTo(tempdate.getTime()));
}
throw new Error("You need to fix the getSchoolTimeTo method!!!!");
start();
