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

## Two modes

`--mode class` (default) sets a cell's level from the **highest road class that
crosses it**: `>=4` in `ROAD_WEIGHTS` (motorway / trunk / primary) is level 3,
`>=1.6` (their links, secondary, tertiary) level 2, the rest fabric at level 1.
This is maptoposter's hierarchy — every arterial reads as an arterial for its
whole length, which is what makes the field read as a road map.

`--mode density` is the original: percentile-quantized weighted road length, a
heatmap. It renders the *shape* of a city well but not its network — a trunk
road through a sparse fringe scores below a knot of residential streets, so the
skeleton dissolves into texture.

`CLASS_FLOOR` (0.5) drops footway, path, cycleway, track and service from class
mode. With them in, the fabric lit 69% of a 320 grid and the background went
back to a wash; the poster's hairlines are residential streets, not footpaths.

## Why it looks the way it does

Four decisions carry the whole result. Changing any of them without knowing why
tends to produce either a featureless blob or a disc. The first two are density
mode's; class mode replaces them with `ROAD_WEIGHTS` + `CLASS_CUTS`.

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

- First run for a city hits Nominatim and Overpass. A wide bbox is not "a minute
  or two": 24km of `network_type="all"` is a ~176MB response and about ten
  minutes / 4.4GB of RAM to build the graph.
- **Two caches, and they cover different things.** osmnx caches the Overpass
  *response* under `cache/<hash>.json`, which saves the download but not the
  graph build. `cache/edges_<lat>_<lon>_<dist>.pkl` is ours: the projected edge
  geometry, lengths and weights, i.e. everything downstream of the build. Keyed
  on point and radius only, so re-rendering with a different `--grid`, `--cuts`,
  `--mode` or falloff takes about 6 seconds instead of ten minutes. Delete
  either file to force that stage again.
- **Never raise `ox.settings.requests_timeout` to nurse a slow call.** The value
  is interpolated into the query text (`[timeout:180]`) and the cache key is a
  hash of that query, so changing it invalidates every response already on disk
  and silently refetches the lot.
- The preview PNG paints levels at the component's shipped alphas
  (`--terras-login-dot-opacity` x `LEVEL_ALPHA` = 0.08 / 0.20 / 0.50). Keep them
  in step by hand if either side changes — a preview at its own brightness
  flatters everything and is then useless as the go/no-go it's meant to be.
- The water call is a separate Overpass request and can fail on its own
  (`no water features (... timed out)` then `water voided 0 cells`). That ships
  a roads-only grid: check the line, don't assume the voids are in.
- `--distance` is a radius in metres (default 12000). Combined with the default
  `--crop`, cell size is `2 * distance * crop / grid` — about 120m at the
  defaults. Much finer and a dense city saturates to a solid field.
- Output size is `grid² / 4` bytes before base64: the default 160 grid is ~8.5KB
  and gzips well, since dot fields are highly structured. Raising `--grid` is
  quadratic, so 320 is not "twice as big", it is four times.
