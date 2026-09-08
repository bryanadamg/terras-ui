#!/usr/bin/env python3
"""Rasterize a city's road network into a 2-bit dot-matrix grid.

Build-time only. Emits src/assets/cityMatrix.<city>.js, consumed by the
CityMatrix component. Not part of the published npm package.
"""

import argparse
import base64
import json
import os
import pickle
import sys
import time

import numpy as np
import osmnx as ox
import shapely
from geopy.geocoders import Nominatim
from shapely.geometry import Point

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ASSETS_DIR = os.path.join(REPO_ROOT, "src", "assets")
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache")


def geocode(city, country):
    geolocator = Nominatim(user_agent="terras-ui-city-matrix")
    time.sleep(1)
    loc = geolocator.geocode(f"{city}, {country}")
    if loc is None:
        sys.exit(f"could not geocode {city}, {country}")
    return loc.latitude, loc.longitude


# Road importance weights, mirroring teras-erp/maptoposter's line-weight hierarchy.
# Without this every cell in a dense metro reads the same: residential grids blanket
# the whole bbox, so unweighted length has almost no core-to-edge contrast.
ROAD_WEIGHTS = {
    "motorway": 6.0,
    "motorway_link": 4.0,
    "trunk": 5.0,
    "trunk_link": 3.5,
    "primary": 4.0,
    "primary_link": 3.0,
    "secondary": 2.5,
    "secondary_link": 2.0,
    "tertiary": 1.6,
    "tertiary_link": 1.3,
    "residential": 1.0,
    "living_street": 0.8,
    "unclassified": 0.8,
    "service": 0.35,
    "track": 0.2,
    "footway": 0.15,
    "path": 0.15,
    "pedestrian": 0.4,
    "cycleway": 0.2,
}
DEFAULT_ROAD_WEIGHT = 0.5

# Weight cuts that split ROAD_WEIGHTS into the three dot levels for --mode class.
# Read off the weights above rather than re-listing the tags: >=4 is motorway /
# trunk / primary (and motorway_link), >=1.6 adds their links plus secondary and
# tertiary, everything else — residential, service, paths — is the fabric.
CLASS_CUTS = (1.6, 4.0)
# Class mode floor. Anything below this is footway, path, cycleway, track and
# service — a third of OSM's ways in a dense metro, and they are not roads. Left
# in, the level-1 fabric lit 69% of the grid and the background went from a road
# map back to a wash. The poster's hairlines are residential streets; this is
# where that line is drawn. (Density mode has no use for it: a footpath's weight
# is 0.15, so it contributes almost nothing to a cell's score anyway.)
CLASS_FLOOR = 0.5


def _road_weight(tag):
    if isinstance(tag, list):
        return max((ROAD_WEIGHTS.get(t, DEFAULT_ROAD_WEIGHT) for t in tag), default=DEFAULT_ROAD_WEIGHT)
    return ROAD_WEIGHTS.get(tag, DEFAULT_ROAD_WEIGHT)


EDGE_CACHE_VERSION = 1


def _edge_cache_path(lat, lon, dist):
    return os.path.join(CACHE_DIR, f"edges_{lat:.7f}_{lon:.7f}_{int(dist)}.pkl")


def load_edges(lat, lon, dist):
    """Projected edge geometry, lengths, weights, crs and centre — cached on disk.

    osmnx's own cache holds the Overpass RESPONSE only, so a re-render at a
    different --grid or --cuts still paid graph_from_point + project_graph +
    graph_to_gdfs: about ten minutes and 4.4GB of RAM on a 48km all-roads bbox,
    which is nearly the whole wall clock. This caches the far side of that step,
    keyed on (point, radius) alone — the only inputs it depends on — so every
    other knob re-renders in seconds. Same idea as maptoposter's
    cache/graph_<lat>_<lon>_<dist>.pkl, one stage later.

    Geometry is stored as WKB rather than pickling the GeoDataFrame: shapely
    vectorises it back in a single call, and it does not pickle pandas/geopandas
    internals into a file that a library upgrade can then refuse to read. Delete
    the file to force a rebuild.
    """
    path = _edge_cache_path(lat, lon, dist)
    if os.path.exists(path):
        try:
            with open(path, "rb") as fh:
                blob = pickle.load(fh)
            if blob.get("version") == EDGE_CACHE_VERSION:
                print(f"  using cached edges ({len(blob['lengths'])} edges)")
                return (
                    shapely.from_wkb(blob["wkb"]),
                    blob["lengths"],
                    blob["weights"],
                    blob["crs"],
                    Point(blob["center"]),
                )
            print("  edge cache is an older version, rebuilding")
        except Exception as exc:  # noqa: BLE001 - a stale cache must never be fatal
            print(f"  edge cache unreadable ({exc}), rebuilding")

    print("  building the road graph (slow; cached after this)")
    g = ox.graph_from_point(
        (lat, lon), dist=dist, dist_type="bbox", network_type="all", truncate_by_edge=True
    )
    g = ox.project_graph(g)
    edges = ox.graph_to_gdfs(g, nodes=False)
    crs = g.graph["crs"]
    center = ox.projection.project_geometry(Point(lon, lat), crs="EPSG:4326", to_crs=crs)[0]

    geoms = edges.geometry.values
    lengths = shapely.length(geoms)
    weights = np.array([_road_weight(t) for t in edges["highway"]], dtype=float)

    # Written via a temp file and renamed: a run interrupted mid-dump would
    # otherwise leave a truncated pickle that the next run has to diagnose.
    tmp = path + ".tmp"
    try:
        with open(tmp, "wb") as fh:
            pickle.dump(
                {
                    "version": EDGE_CACHE_VERSION,
                    "wkb": shapely.to_wkb(geoms),
                    "lengths": lengths,
                    "weights": weights,
                    "crs": crs,
                    "center": (center.x, center.y),
                },
                fh,
                protocol=pickle.HIGHEST_PROTOCOL,
            )
        os.replace(tmp, path)
        print(f"  cached edges -> {os.path.basename(path)}")
    except Exception as exc:  # noqa: BLE001 - the render must not fail over a cache write
        print(f"  could not cache edges ({exc})")

    return geoms, lengths, weights, crs, center


def _sample_points(geoms, lengths, weights, dist, grid, crop, center):
    """Densified sample points for every edge, plus the grid's bin edges.

    Shared by both modes: whether a cell ends up scored by road length or by road
    class, the sampling underneath is identical.
    """
    half = dist * crop
    cell = (2 * half) / grid
    step = cell / 2.0

    # Densify every edge into weighted sample points: a straight residential
    # street is only two vertices over 200m, so binning raw vertices would
    # deposit its whole length into two cells and read as noise.
    counts = np.maximum(1, np.ceil(lengths / step).astype(np.int64))
    idx = np.repeat(np.arange(len(geoms)), counts)
    starts = np.concatenate(([0], np.cumsum(counts)[:-1]))
    offsets = np.arange(len(idx)) - starts[idx]
    spacing = lengths[idx] / counts[idx]
    pts = shapely.line_interpolate_point(geoms[idx], (offsets + 0.5) * spacing)
    xy = shapely.get_coordinates(pts)

    x_edges = np.linspace(center.x - half, center.x + half, grid + 1)
    y_edges = np.linspace(center.y - half, center.y + half, grid + 1)
    return xy, spacing, weights[idx], x_edges, y_edges


def road_density(lat, lon, dist, grid, crop):
    """Importance-weighted road length per grid cell, as a (grid, grid) array."""
    geoms, lengths, weights, crs, center = load_edges(lat, lon, dist)
    xy, spacing, w, x_edges, y_edges = _sample_points(
        geoms, lengths, weights, dist, grid, crop, center
    )
    dens, _, _ = np.histogram2d(
        xy[:, 0], xy[:, 1], bins=[x_edges, y_edges], weights=spacing * w
    )

    # histogram2d is [x][y] with y ascending; we want row-major top-down.
    return np.flipud(dens.T), crs, center


def road_classes(lat, lon, dist, grid, crop):
    """Highest road CLASS crossing each cell, as levels 0..3.

    This is the poster's hierarchy rather than a heatmap: maptoposter draws each
    highway class as a line of its own width, so an arterial reads as an arterial
    wherever it runs. Density quantized by percentile cannot do that — a trunk
    road through a sparse fringe scores lower than a knot of residential streets,
    so the network dissolves into texture and the background stops reading as a
    map. Taking the max class per cell paints the same skeleton in dots: every
    primary road is level 3 for its whole length, and the residential fabric
    fills in at level 1 underneath.

    Nothing here needs a refetch — ROAD_WEIGHTS is already a monotone stand-in
    for the class, and the cached edges carry it.
    """
    geoms, lengths, weights, crs, center = load_edges(lat, lon, dist)
    xy, _, w, x_edges, y_edges = _sample_points(
        geoms, lengths, weights, dist, grid, crop, center
    )

    # histogram2d silently drops out-of-range points; maximum.at would fold them
    # onto the edge rows instead, so the crop has to be applied by hand.
    keep = (
        (w >= CLASS_FLOOR)
        & (xy[:, 0] >= x_edges[0])
        & (xy[:, 0] <= x_edges[-1])
        & (xy[:, 1] >= y_edges[0])
        & (xy[:, 1] <= y_edges[-1])
    )
    xy = xy[keep]
    lvl = (np.digitize(w[keep], CLASS_CUTS) + 1).astype(np.uint8)

    ix = np.clip(np.searchsorted(x_edges, xy[:, 0], side="right") - 1, 0, grid - 1)
    iy = np.clip(np.searchsorted(y_edges, xy[:, 1], side="right") - 1, 0, grid - 1)
    out = np.zeros((grid, grid), dtype=np.uint8)
    np.maximum.at(out, (iy, ix), lvl)

    # y bins ascend north; the grid is row-major top-down.
    return np.flipud(out), crs, center


def water_mask(lat, lon, dist, grid, crop, crs, center):
    """True where a cell is majority water. Voids are what make the shape legible."""
    tags = {"natural": ["water", "bay", "strait"], "waterway": "riverbank"}
    try:
        gdf = ox.features_from_point((lat, lon), tags=tags, dist=dist)
    except Exception as exc:  # noqa: BLE001 - upstream raises bare Exception when empty
        print(f"  no water features ({exc})")
        return np.zeros((grid, grid), dtype=bool)
    if gdf.empty:
        return np.zeros((grid, grid), dtype=bool)

    gdf = gdf.to_crs(crs)
    polys = [g for g in gdf.geometry.values if g is not None and g.geom_type in ("Polygon", "MultiPolygon")]
    if not polys:
        return np.zeros((grid, grid), dtype=bool)
    water = shapely.union_all(polys)

    half = dist * crop
    axis_x = np.linspace(center.x - half, center.x + half, grid + 1)
    axis_y = np.linspace(center.y - half, center.y + half, grid + 1)
    cx = (axis_x[:-1] + axis_x[1:]) / 2.0
    cy = (axis_y[:-1] + axis_y[1:]) / 2.0
    gx, gy = np.meshgrid(cx, cy)
    hits = shapely.contains_xy(water, gx.ravel(), gy.ravel()).reshape(grid, grid)
    return np.flipud(hits)


def radial_falloff(grid, inner, outer):
    """Smoothstep mask, 1.0 inside `inner`, 0.0 beyond `outer` (both 0..1 of half-extent)."""
    axis = (np.arange(grid) + 0.5) / grid * 2.0 - 1.0
    gx, gy = np.meshgrid(axis, axis)
    r = np.sqrt(gx**2 + gy**2)
    t = np.clip((r - inner) / (outer - inner), 0.0, 1.0)
    return 1.0 - (t * t * (3.0 - 2.0 * t))


def quantize(dens, cuts):
    """Percentile-quantize nonzero density into levels 0..3."""
    nz = dens[dens > 0]
    if nz.size == 0:
        sys.exit("no road data in grid — check --distance")
    thresholds = np.percentile(nz, cuts)
    levels = np.zeros(dens.shape, dtype=np.uint8)
    for i, t in enumerate(thresholds):
        levels[dens > t] = i + 1
    return levels


def pack(levels):
    """Four 2-bit cells per byte, row-major, high bits first."""
    flat = levels.reshape(-1).astype(np.uint8) & 0x03
    if flat.size % 4:
        flat = np.concatenate((flat, np.zeros(4 - flat.size % 4, dtype=np.uint8)))
    q = flat.reshape(-1, 4)
    packed = (q[:, 0] << 6) | (q[:, 1] << 4) | (q[:, 2] << 2) | q[:, 3]
    return base64.b64encode(packed.tobytes()).decode("ascii")


def write_module(path, city, lat, lon, dist, levels, cells, mode):
    grid = levels.shape[0]
    lit = int((levels > 0).sum())
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(
            "// Generated by tools/city-matrix/generate.py — do not hand-edit.\n"
            f"// {city} @ {lat:.4f},{lon:.4f}, {dist}m radius, {mode} mode, "
            f"{grid}x{grid} grid, {lit} lit cells.\n"
            "// Road-length density per cell, quantized to 4 levels, 2 bits per cell,\n"
            "// row-major, base64. Decoded by src/components/CityMatrix.js.\n"
            "module.exports = {\n"
        )
        fh.write(
            f"  city: {json.dumps(city)},\n"
            f"  w: {grid},\n"
            f"  h: {grid},\n"
            "  levels: 4,\n"
            f'  cells: "{cells}"\n'
            "};\n"
        )


def write_preview(path, levels, pitch=4, dot=2):
    from PIL import Image, ImageDraw

    grid = levels.shape[0]
    size = grid * pitch
    img = Image.new("RGB", (size, size), (13, 31, 92))
    draw = ImageDraw.Draw(img)
    # The component's shipped values: --terras-login-dot-opacity (0.5) times
    # CityMatrix's LEVEL_ALPHA (0.16/0.4/1). Keep these in step by hand, same
    # rule as tokens.json <-> tokens.css — a preview painted at its own
    # brightness is what let a 61%-lit fabric look acceptable here and wash out
    # the sign-in screen, and this PNG is meant to be the go/no-go.
    alphas = {1: 0.08, 2: 0.20, 3: 0.50}
    for row in range(grid):
        for col in range(grid):
            lvl = int(levels[row, col])
            if not lvl:
                continue
            a = alphas[lvl]
            color = (int(13 + (219 - 13) * a), int(31 + (233 - 31) * a), int(92 + (255 - 92) * a))
            x, y = col * pitch, row * pitch
            draw.rectangle([x, y, x + dot - 1, y + dot - 1], fill=color)
    img.save(path)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--city", "-c", required=True)
    ap.add_argument("--country", "-C", required=True)
    ap.add_argument("--distance", "-d", type=int, default=12000, help="fetch radius, metres")
    ap.add_argument("--grid", "-g", type=int, default=160, help="grid cells per side")
    ap.add_argument(
        "--crop",
        type=float,
        default=0.8,
        help="fraction of --distance to keep; trims the Overpass bbox's hard square edge",
    )
    # Corner trim only. A strong falloff makes the city read as a disc rather than
    # as itself — the reference globe is round because it is a globe.
    ap.add_argument("--inner", type=float, default=0.92, help="radial falloff start (0..1)")
    ap.add_argument("--outer", type=float, default=1.45, help="radial falloff end (0..1)")
    ap.add_argument(
        "--cuts",
        default="70,88,96",
        help="percentiles of nonzero density for levels 1/2/3",
    )
    ap.add_argument(
        "--mode",
        choices=("class", "density"),
        default="class",
        help="class: level = highest road class in the cell (reads as a road map). "
        "density: percentile-quantized weighted road length (reads as a heatmap)",
    )
    ap.add_argument("--no-water", action="store_true", help="skip the water void mask")
    ap.add_argument("--preview", action="store_true", help="also write a PNG next to the module")
    ap.add_argument("--out", help="output .js path (default src/assets/cityMatrix.<city>.js)")
    args = ap.parse_args()

    os.makedirs(CACHE_DIR, exist_ok=True)
    ox.settings.use_cache = True
    ox.settings.cache_folder = CACHE_DIR
    # Do NOT raise settings.requests_timeout to nurse a slow Overpass call: the
    # value is interpolated into the query text ([timeout:180]) and the cache key
    # is a hash of that query, so changing it silently invalidates every response
    # already on disk and refetches a 176MB body. Retry instead.

    cuts = [float(x) for x in args.cuts.split(",")]
    if len(cuts) != 3:
        sys.exit("--cuts needs exactly three percentiles")

    lat, lon = geocode(args.city, args.country)
    print(f"{args.city}, {args.country} -> {lat:.6f},{lon:.6f}")

    fade = radial_falloff(args.grid, args.inner, args.outer)
    if args.mode == "density":
        dens, crs, center = road_density(lat, lon, args.distance, args.grid, args.crop)
        levels = quantize(dens * fade, cuts)
    else:
        levels, crs, center = road_classes(lat, lon, args.distance, args.grid, args.crop)
        # In density mode the falloff scales a score and the quantizer does the
        # rest. A class level has no magnitude to scale, so the corner trim is
        # applied as a cut: only where the mask has gone to zero, which is the
        # corners it exists for.
        levels[fade <= 0.0] = 0

    if not args.no_water:
        wet = water_mask(lat, lon, args.distance, args.grid, args.crop, crs, center)
        levels[wet] = 0
        print(f"  water voided {int(wet.sum())} cells")

    print(f"  mode: {args.mode}")
    slug = args.city.lower().replace(" ", "-")
    out = args.out or os.path.join(ASSETS_DIR, f"cityMatrix.{slug}.js")
    cells = pack(levels)
    write_module(out, args.city, lat, lon, args.distance, levels, cells, args.mode)

    lit = int((levels > 0).sum())
    total = levels.size
    print(f"wrote {out}  ({len(cells)} b64 chars, {lit}/{total} cells lit, {lit / total:.0%})")
    for lvl in (1, 2, 3):
        print(f"  level {lvl}: {int((levels == lvl).sum())}")

    if args.preview:
        # Never beside the module: src/ is the published package, and a 640px PNG
        # of the same data would ship to every consumer.
        preview_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "preview")
        os.makedirs(preview_dir, exist_ok=True)
        png = os.path.join(preview_dir, f"{slug}.png")
        write_preview(png, levels)
        print(f"wrote {png}")


if __name__ == "__main__":
    main()
