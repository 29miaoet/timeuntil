# timeuntil

🎉 Welcome to [**timeuntil**](https://29miaoet.github.io/timeuntil)!

## Structure

<pre><code>
timeuntil/
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml
│   │   ├── format.yml
│   │   ├── test.yml
│   │   └── release.yml
│   │ 
│   ├── dependabot.yml
│   └── CONTRIBUTING.md
│
├── src/
│   ├── styles/
│   │   ├── components/
│   │   │   ├── countdown.css
│   │   │   └── menu.css
│   │   │
│   │   ├── base.css
│   │   ├── media.css
│   │   └── themes.css
│   │ 
│   ├── data/
│   │   ├── schools.json
│   │   └── schedule.json
│   │ 
│   ├── classes/
│   │   ├── day.ts
│   │   └── menu.ts
│   │ 
│   ├── core/
│   │   ├── app.ts
│   │   ├── calendar.ts
│   │   ├── calendar.test.ts
│   │   └── state.ts
│   │ 
│   ├── modules/
│   │   ├── DayActions.ts
│   │   ├── finish.ts
│   │   └── preferences.ts
│   │ 
│   ├── UI/
│   │   ├── DomUpdate.ts
│   │   └── SlowDomUpdate.ts
│   │ 
│   ├── helpers/
│   │   └── fetchCalendar.ts
│   │ 
│   ├── types/
│   │   ├── global.d.ts
│   │   └── vite-env.d.ts
│   │ 
│   └── main.ts
│
├── public/
│   ├── calendars/
│   │   ├── gci.json
│   │   ├── dci.json
│   │   ├── cjs.json
│   │   └── burland.json
│   │
│   ├── manifest.webmanifest
│   ├── favicon.svg
│   └── github.svg
│
├── scripts/
│   ├── fetch_calendar.py
│   └── scrape_id.py
│
├── .gitignore
├── .prettierignore
├── .prettierrc
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
│
├── LICENSE
└── README.md
</code></pre>

## Overview

Timeuntil is a project focused on counting down the exact time until school ends.
Unlike a typical school calendar, it gives you the information you _want to know_
at a glance, without any other distractions, so you can focus on the important
stuff.  
This app runs **entirely in your browser** _(because I don't have a server, not
because I care about your privacy)_. As of the latest version, the entire website
fits under `13.42KB` gzipped, which means it can fit into a **single** TCP
round-trip, making page load almost unoticable.

## Attributes

- ✅ Responsive UI layout
- ✅ Customization options
- ✅ Modern HTML, CSS and TypeScript code
- ✅ Modern npm build stack
- ✅ Only ~10ms drift between displays

## Requisites

- Modern GUI browser
- JavaScript enabled

## Contributing

Please refer to [CONTRIBUTING.md](.github/CONTRIBUTING.md).

## Technology Stack

| Layer        | Technology            | Notes                                 |
| ------------ | --------------------- | ------------------------------------- |
| **Hosting**  | GitHub Pages          | Static site deployment                |
| **Frontend** | HTML, CSS, TypeScript | Modern language stack                 |
| **Build**    | vite.js               | Fast and efficient build step         |
| **DevOps**   | Github Actions        | Automated tests and formatting checks |

## Future Path

- [x] Add functionality to UI buttons.
- [x] Finish basic website UI.
- [x] Organize and shorten code by using more functions.
- [x] Harden code logic.
- [x] Add and configure vitest.
- [x] Refactor and split source files.
- [ ] Add and configure ESlint after TypeScript 7.1 is released.
- ~~Migrate UI handlers to React.~~
- ~~Transform static CSS into Sass.~~

## Stats

- ![Release](https://img.shields.io/github/v/release/29miaoet/timeuntil)
- ![License](https://img.shields.io/badge/license-MIT-green)
- ![Deployed](https://img.shields.io/badge/deployed-GitHub%20Pages-orange)
- ![Website status](https://img.shields.io/website?url=https://29miaoet.github.io/timeuntil/)
- ![Code style](https://img.shields.io/badge/code_style-prettier-pink)
- ![Repo size](https://img.shields.io/github/repo-size/29miaoet/timeuntil)
- ![Total commits](https://img.shields.io/github/commit-activity/t/29miaoet/timeuntil)
- ![Last commit](https://img.shields.io/github/last-commit/29miaoet/timeuntil)
- ![Average commit activity](https://img.shields.io/github/commit-activity/m/29miaoet/timeuntil)
- ![Language count](https://img.shields.io/github/languages/count/29miaoet/timeuntil)
- ![Top language](https://img.shields.io/github/languages/top/29miaoet/timeuntil)
- ![Issues](https://img.shields.io/github/issues/29miaoet/timeuntil)
- ![Closed issues](https://img.shields.io/github/issues-closed/29miaoet/timeuntil)
- ![Pull requests](https://img.shields.io/github/issues-pr/29miaoet/timeuntil)
- ![Closed Pull requests](https://img.shields.io/github/issues-pr-closed/29miaoet/timeuntil)

## Utilized Tools

- [Node.js](https://github.com/nodejs/node)
- [TypeScript](https://github.com/microsoft/TypeScript)
- [Vite](https://github.com/vitejs/vite)
- [Prettier](https://github.com/prettier/prettier)
- [Vitest](https://github.com/vitest-dev/vitest)
- [Dependabot](https://github.com/dependabot)
- [GitHub Actions](https://github.com/actions)

## License

This project is published under the MIT license, for more details, view the [LICENSE](.github/LICENSE).

_<p align="center"><sub>©2026 – Ethan Miao - MIT License</sub></p>_
