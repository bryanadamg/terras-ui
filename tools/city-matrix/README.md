# city-matrix

Rasterizes a city's OpenStreetMap road network into the 2-bit dot grid that
`CityMatrix` paints behind the sign-in field.

**Build-time only.** `package.json` ships `files: ["src"]`, so nothing in
`tools/` reaches the npm package. Run it when you need a new city or a
different grid; commit the emitted module, not the environment.

```bash
python -m venv .venv && .venv/Scripts/activate   # or: source .venv/bin/activate
pip install -r requirements.txt

python generate.py --city "Tangerang" --country "Indonesia" --preview
```

Writes `src/assets/cityMatrix.<slug>.js` and, with `--preview`, a PNG under
`tools/city-matrix/preview/` for eyeballing before you wire anything up. Look at
the preview first — if the city doesn't read as a city there, no amount of
component tuning will save it.

## Why it looks the way it does

Four decisions carry the whole result. Changing any of them without knowing why
tends to produce either a featureless blob or a disc.

- **Road length is weighted by OSM `highway` class** (`ROAD_WEIGHTS`, mirroring
  teras-erp's line-weight hierarchy). Unweighted length has almost no
  core-to-edge contrast in a dense metro — residential grids blanket the entire
  bbox, so every cell scores about the same and the output is a flat field. The
  weighting is what makes arterials and the centre legible.
- **Levels are percentiles of nonzero density**, not fixed metre thresholds
  (`--cuts`, default `70,88,96`). Density self-normalizes, so a sprawling city
  and a tight one both get a bright core and a scattered fringe. Fixed
  thresholds blow out one and flatten the other.
- **The radial falloff only trims corners** (`--inner 0.92 --outer 1.45`). A
  strong falloff makes any city read as a circle; the Cloudflare reference is
  round because it is a globe. `--crop` (default 0.8) discards the outer fifth of
  the fetch, where the Overpass bbox cuts roads off in a hard straight line.
- **Water is punched out as level 0.** The voids are doing as much work as the
  dots — a river or a bay is what makes the shape identifiable rather than
  texture. `--no-water` skips the extra Overpass call.

## Notes

- First run for a city hits Nominatim and Overpass and takes a minute or two.
  Responses cache under `tools/city-matrix/cache/` (gitignored); delete it to
  force a refetch.
- `--distance` is a radius in metres (default 12000). Combined with the default
  `--crop`, cell size is `2 * distance * crop / grid` — about 120m at the
  defaults. Much finer and a dense city saturates to a solid field.
- Output size is `grid² / 4` bytes before base64: the default 160 grid is ~8.5KB
  and gzips well, since dot fields are highly structured. Raising `--grid` is
  quadratic, so 320 is not "twice as big", it is four times.
