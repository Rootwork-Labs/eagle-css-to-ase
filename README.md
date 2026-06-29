# CSS to ASE

Convert CSS palette files into Adobe Swatch Exchange (`.ase`) swatch palettes.

Includes:

- **CLI** — convert any CSS file on disk
- **Eagle plugin** — convert selected library CSS items, write a sidecar `.ase`, and import it into the same folders/tags

Parser support matches [eagle-palette-viewer](https://github.com/Rootwork-Labs/eagle-css-to-ase): design-token ramps (`--color-family-shade`, `--family-shade`), flat exports, and related CSS palette formats.

## CLI

```bash
npm test
node bin/convert-css-to-ase.js test/fixtures/colors.css
node bin/convert-css-to-ase.js theme.css --output ./Sample.ase --name Sample
```

Or link the bin globally:

```bash
npm link
css-to-ase path/to/palette.css
```

## Eagle plugin

Symlink this repo into Eagle's plugin directory:

```bash
ln -sfn "/path/to/eagle-css-to-ase" "$HOME/Library/Application Support/Eagle/Plugins/css-to-ase"
```

Restart Eagle, select one or more `.css` palette files, open **CSS to ASE**, and click **Convert selected**.

The plugin writes `{name}.ase` beside each CSS file in the library item folder and imports it into Eagle. If an `.ase` item already exists at that path, it replaces the file in place.

Pair with [eagle-palette-viewer](https://github.com/Rootwork-Labs/eagle-css-to-ase) to preview `.ase` files directly in Eagle.

## Project layout

| Path | Purpose |
|------|---------|
| `convert-core.js` | Shared conversion logic (CLI + Eagle) |
| `lib/ase-writer.js` | Adobe `.ase` binary writer |
| `lib/css-to-swatches.js` | Flatten parsed CSS families into swatch rows |
| `parsers/` | CSS palette parsing |
| `bin/convert-css-to-ase.js` | CLI entry point |
| `plugin.js` | Thin Eagle wrapper |

## Notes

- Output uses RGB floats in standard ASE format, compatible with Affinity Designer and Adobe apps.
- All parsed colors are exported (every shade/token), not just one swatch per family.
- Keep `parsers/` in sync with `eagle-palette-viewer` when CSS parsing changes.
