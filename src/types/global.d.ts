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
