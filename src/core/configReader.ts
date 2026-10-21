import rawConfig from "../data/config.json";

interface Schedule {
  Regular: [number, number];
  "Early Dismissal": [number, number];
}

interface SchoolSchedule {
  "High School": Schedule;
  "Elementary School": Schedule;
}

interface Config {
  start: string;
  end: string;
  Summer: string;
  "Winter Break": string;
  "Spring Break": string;
  "School Starts": string;
  "Last Summer": string;
  "Term Ends": Array<[number, number, number, number, number]>;
  "School Schedule": SchoolSchedule;
}

const config = rawConfig as Config;
export default config;
