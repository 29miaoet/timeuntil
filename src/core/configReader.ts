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

export const version = fetch("https://api.github.com/repos/29miaoet/timeuntil/releases/latest")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.json();
  })
  .then((release) => {
    if (
      typeof release === "object" &&
      release !== null &&
      "tag_name" in release &&
      typeof release.tag_name === "string"
    ) {
      return release.tag_name;
    }
  })
  .catch((error: unknown) => {
    console.warn("Could not fetch latest release version:", error);
    return null;
  });
