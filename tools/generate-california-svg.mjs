import fs from "node:fs";

// Source: U.S. Census Bureau TIGERweb State_County MapServer, STATE 06 (California), 2025.

const input = process.argv[2];
if (!input) throw new Error("Pass the Census California GeoJSON path.");

const geojson = JSON.parse(fs.readFileSync(input, "utf8"));
const geometry = geojson.features.find((feature) => feature.properties?.STATE === "06")?.geometry;
if (!geometry || geometry.type !== "MultiPolygon") throw new Error("California MultiPolygon was not found.");

const signedArea = (ring) => ring.reduce((sum, point, index) => {
  const next = ring[(index + 1) % ring.length];
  return sum + point[0] * next[1] - next[0] * point[1];
}, 0) / 2;

const mainland = geometry.coordinates
  .map((polygon) => polygon[0])
  .sort((a, b) => Math.abs(signedArea(b)) - Math.abs(signedArea(a)))[0];

const latScale = Math.cos(37 * Math.PI / 180);
const projected = mainland.map(([longitude, latitude]) => [longitude * latScale, -latitude]);
const bounds = projected.reduce((box, [x, y]) => ({
  minX: Math.min(box.minX, x), maxX: Math.max(box.maxX, x),
  minY: Math.min(box.minY, y), maxY: Math.max(box.maxY, y),
}), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

const width = 520;
const height = 680;
const padding = 34;
const scale = Math.min((width - padding * 2) / (bounds.maxX - bounds.minX), (height - padding * 2) / (bounds.maxY - bounds.minY));
const offsetX = (width - (bounds.maxX - bounds.minX) * scale) / 2;
const offsetY = (height - (bounds.maxY - bounds.minY) * scale) / 2;
const toCanvas = ([x, y]) => [(x - bounds.minX) * scale + offsetX, (y - bounds.minY) * scale + offsetY];

const distanceToSegment = (point, start, end) => {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) return Math.hypot(point[0] - start[0], point[1] - start[1]);
  const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point[0] - (start[0] + t * dx), point[1] - (start[1] + t * dy));
};

const simplify = (points, tolerance) => {
  if (points.length <= 2) return points;
  let maxDistance = 0;
  let splitIndex = 0;
  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = distanceToSegment(points[index], points[0], points.at(-1));
    if (distance > maxDistance) { maxDistance = distance; splitIndex = index; }
  }
  if (maxDistance <= tolerance) return [points[0], points.at(-1)];
  return [...simplify(points.slice(0, splitIndex + 1), tolerance).slice(0, -1), ...simplify(points.slice(splitIndex), tolerance)];
};

const points = simplify(projected.map(toCanvas), 1.15);
const path = `${points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")} Z`;
const cities = {
  ukiah: [-123.2078, 39.1502], petaluma: [-122.6367, 38.2324], "elk-grove": [-121.3716, 38.4088],
  livermore: [-121.7680, 37.6819], "signal-hill": [-118.1684, 33.8045], vista: [-117.2425, 33.2000],
};
const cityPositions = Object.fromEntries(Object.entries(cities).map(([name, [longitude, latitude]]) => {
  const [x, y] = toCanvas([longitude * latScale, -latitude]);
  return [name, { left: `${(x / width * 100).toFixed(1)}%`, top: `${(y / height * 100).toFixed(1)}%` }];
}));

console.log(JSON.stringify({ viewBox: `0 0 ${width} ${height}`, path, cityPositions, points: points.length }, null, 2));
