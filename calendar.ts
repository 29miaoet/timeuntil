class Calendar {
  public calendar: any;
  private dbPath: string;
  private startTime: number;
  private endTime: number;
  public now: number;

  constructor(dbPath: string, startTime: number, endTime: number) {
    this.dbPath = dbPath;
    this.startTime = startTime;
    this.endTime = endTime;
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
  snapshot() {
    this.now = Date.now();
  }

  getAbsoluteTime() {
    const timeObj = new Date(this.now);
    const absoluteTime = {
      days: timeObj.getDay(),
      hours: timeObj.getHours(),
      minutes: timeObj.getMinutes(),
      seconds: timeObj.getSeconds()
    }
    console.log(absoluteTime);
    return absoluteTime;
  }


}

async function start() {
  const cal = new Calendar("calendar.json", 0, 0);
  await cal.loadData();
  console.log(cal.strftime(Date.now()))
  cal.getAbsoluteTime();
  const id: number = setInterval(() => cal.getAbsoluteTime(), 1000);
}

start();
