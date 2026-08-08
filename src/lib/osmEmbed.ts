// Builds an OpenStreetMap "export/embed" URL centered on a point. A fixed +/-0.05 degree
// box keeps the zoom level roughly consistent across cities without calling any geocoding
// or tile-size API - this is a pure, offline URL builder.
const BBOX_DELTA_DEGREES = 0.05

export function buildOsmEmbedUrl(lat: number, lon: number): string {
  const latMin = (lat - BBOX_DELTA_DEGREES).toFixed(4)
  const latMax = (lat + BBOX_DELTA_DEGREES).toFixed(4)
  const lonMin = (lon - BBOX_DELTA_DEGREES).toFixed(4)
  const lonMax = (lon + BBOX_DELTA_DEGREES).toFixed(4)
  const bbox = `${lonMin},${latMin},${lonMax},${latMax}`
  const marker = `${lat.toFixed(4)},${lon.toFixed(4)}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`
}
