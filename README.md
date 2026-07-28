# Mach dir deinen Bundestag

An interactive project for exploring how selected voter groups could change the composition of the German Bundestag.

## Application folders

The repository currently contains two frontend workspaces:

- The application in the repository root is the temporary **legacy reference**. It remains available for checking existing data structures, calculations, filters, and behavior during the rebuild.
- [`app-v2/`](./app-v2/) is the independent **rebuild workspace** for the new static one-page application. New rebuild work belongs there and must not import the legacy component tree, state, or styles.

The legacy application will stay in place until the rebuild is ready for the final cut-over.

## Rebuild documentation

The agreed rebuild scope and milestone tickets are documented in [`docs/rebuild/`](./docs/rebuild/). Do not use `docs/tasks.md` as a roadmap.

## Run the legacy reference

From the repository root:

```bash
npm install
npm run dev
```

The root project also provides `npm run lint` and `npm run build`.

## Run the new application

From `app-v2/`:

```bash
npm install
npm run dev
npm run lint
npm run build
```

See [`app-v2/README.md`](./app-v2/README.md) for details.
