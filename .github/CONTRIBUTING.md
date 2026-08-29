# Contributing

Thanks for your interest in contributing to this project.  
_Please make sure you have npm installed before contributing._

## Getting Started

1. Clone and run locally

```shell
git clone https://github.com/29miaoet/timeuntil.git
cd timeuntil
npm install
npm run dev
# Open http://localhost:5173/timeuntil/ in your browser and verify everything works.
```

2. Make your changes

```shell
# Edit the file
git checkout -b your-branch-name
git add .
git commit -m "describe your changes"
```

3. Run testing

```shell
npm run typecheck
# Fix any errors
npm run build
npm run preview
# Open http://localhost:4173/timeuntil/ in your browser.
```

4. Format and push

```shell
npm run format
git add .
git commit -m "Run format"
git push -u origin your-branch-name
# Open a pull request on GitHub
```

## Guidelines

- Use `Array<T>` for typing arrays instead of `T[]`.
- Use `error` for error catching and `event` for event handling, do not use `e`.
- Use CSS variables instead of direct values.
- Use LF line returns instead of CRLF or CR whenever possible, or ensure you have the correct git configurations.
- Use HTML syntax instead of XHTML syntax.
- Background color schemes should follow those of the existing `:root` elements.
- Prefer aria-labels for accessibility over direct `<label>` tags.
- New files or folders should be organized in the same fashion as the existing structure.

## Resources

- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [More Docs](https://developer.mozilla.org/en-US/)
