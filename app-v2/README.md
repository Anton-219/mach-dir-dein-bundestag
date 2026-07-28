# app-v2

`app-v2` is the independent rebuild workspace for the new static one-page application. It does not import components, state, or styles from the legacy application in the repository root.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Commands

Run all commands from the `app-v2/` directory.

```bash
npm install
npm run dev
npm run lint
npm run build
```

- `npm run dev` starts the Vite development server.
- `npm run lint` checks the TypeScript and React source files.
- `npm run build` runs the TypeScript project build and creates the production bundle in `dist/`.
