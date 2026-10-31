import type { MapNode } from '@/types';

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface SvgPoint {
  x: number;
  y: number;
}

export interface CalibrationPoint {
  name: string;
  geo: GeoPoint;
  /** Campus SVG point that corresponds to this GPS control point. */
  svg?: SvgPoint;
  /** Exact gate nodes carry more weight than road-edge control points. */
  weight?: number;
}

/** User supplied MITS Gwalior ground control points. */
export const CAMPUS_CALIBRATION_POINTS: Record<string, CalibrationPoint> = {
  jubileeGate: {
    name: 'Jubilee Gate',
    geo: { lat: 26.229649, lon: 78.205597 },
    svg: { x: 749.9669, y: 127.5277 },
    weight: 4,
  },
  newParkingGate: {
    name: 'New parking gate',
    geo: { lat: 26.231376, lon: 78.203634 },
    // Closest point on the existing MainRoad11–MainRoad12 graph edge.
    svg: { x: 253.0593, y: 171.2889 },
  },
  mainGate: {
    name: 'Main gate',
    geo: { lat: 26.232647, lon: 78.205241 },
    svg: { x: 253.0593, y: 606.1033 },
    weight: 4,
  },
  workshopEdge: {
    name: 'Edge near mechanical workshop',
    geo: { lat: 26.230833, lon: 78.207078 },
    // Closest point on the existing JubileeRoad14–JubileeRoad15 graph edge.
    svg: { x: 799.8508, y: 531.8075 },
  },
};

const jubileeAnchor = CAMPUS_CALIBRATION_POINTS.jubileeGate;
function requireAnchorSvg(point: CalibrationPoint): SvgPoint {
  if (!point.svg) throw new Error('Campus GPS projection requires an SVG anchor for Jubilee Gate.');
  return point.svg;
}
const jubileeSvg = requireAnchorSvg(jubileeAnchor);
const metersPerDegreeLat = 111_320;
const metersPerDegreeLon = metersPerDegreeLat * Math.cos(jubileeAnchor.geo.lat * Math.PI / 180);

interface AffineTransform {
  east: [number, number, number];
  north: [number, number, number];
}

function solve3x3(matrix: number[][], values: number[]): [number, number, number] {
  const augmented = matrix.map((row, index) => [...row, values[index]]);
  for (let pivot = 0; pivot < 3; pivot += 1) {
    let bestRow = pivot;
    for (let row = pivot + 1; row < 3; row += 1) {
      if (Math.abs(augmented[row][pivot]) > Math.abs(augmented[bestRow][pivot])) bestRow = row;
    }
    [augmented[pivot], augmented[bestRow]] = [augmented[bestRow], augmented[pivot]];
    const divisor = augmented[pivot][pivot];
    if (Math.abs(divisor) < 1e-12) throw new Error('Campus GPS control points do not define a stable projection.');
    for (let column = pivot; column < 4; column += 1) augmented[pivot][column] /= divisor;
    for (let row = 0; row < 3; row += 1) {
      if (row === pivot) continue;
      const factor = augmented[row][pivot];
      for (let column = pivot; column < 4; column += 1) {
        augmented[row][column] -= factor * augmented[pivot][column];
      }
    }
  }
  return [augmented[0][3], augmented[1][3], augmented[2][3]];
}

function fitCampusProjection(points: CalibrationPoint[]): AffineTransform {
  const normal = Array.from({ length: 3 }, () => [0, 0, 0]);
  const eastValues = [0, 0, 0];
  const northValues = [0, 0, 0];
  for (const point of points) {
    if (!point.svg) continue;
    const row = [point.svg.x - jubileeSvg.x, point.svg.y - jubileeSvg.y, 1];
    const east = (point.geo.lon - jubileeAnchor.geo.lon) * metersPerDegreeLon;
    const north = (point.geo.lat - jubileeAnchor.geo.lat) * metersPerDegreeLat;
    const weight = point.weight ?? 1;
    for (let index = 0; index < 3; index += 1) {
      eastValues[index] += weight * row[index] * east;
      northValues[index] += weight * row[index] * north;
      for (let column = 0; column < 3; column += 1) {
        normal[index][column] += weight * row[index] * row[column];
      }
    }
  }
  return { east: solve3x3(normal, eastValues), north: solve3x3(normal, northValues) };
}

const campusProjection = fitCampusProjection(Object.values(CAMPUS_CALIBRATION_POINTS));

/** Maps campus SVG canvas coordinates to WGS84 coordinates. */
export function svgToGps(svg: SvgPoint): GeoPoint {
  const dx = svg.x - jubileeSvg.x;
  const dy = svg.y - jubileeSvg.y;
  const east = campusProjection.east[0] * dx + campusProjection.east[1] * dy + campusProjection.east[2];
  const north = campusProjection.north[0] * dx + campusProjection.north[1] * dy + campusProjection.north[2];
  return {
    lat: jubileeAnchor.geo.lat + north / metersPerDegreeLat,
    lon: jubileeAnchor.geo.lon + east / metersPerDegreeLon,
  };
}

const mainGroundToCampus = {
  x: [0.9907877085943264, -0.158691572146277, 53.87954672277097],
  y: [0.00007081019858534013, 0.8483058951259533, 70.29782674887429],
};
const mainFirstToGround = {
  x: [0.9152175152970835, -0.014621067142837148, 105.49871843122277],
  y: [-0.008315712372633828, 0.9952873054065864, 24.098547956566012],
};
const mainSecondScaleX = (673.8134 - 394.4221) / (707.2826 - 28.0434);
const mainSecondOffsetX = 394.4221 - 28.0434 * mainSecondScaleX;
const aiGroundScaleX = (522.8321 - 331.918) / (753.2538 - 142.4783);
const aiGroundScaleY = (243.9043 - 159.0089) / (361.7772 - 220.2832);

/** Converts a graph node on any supported floor to campus WGS84 coordinates. */
export function getNodeGps(node: MapNode): GeoPoint {
  if (node.id === 'Jubilee_Gate') return CAMPUS_CALIBRATION_POINTS.jubileeGate.geo;
  if (node.id === 'Main_Gate') return CAMPUS_CALIBRATION_POINTS.mainGate.geo;

  let campusPoint: SvgPoint = { x: node.x, y: node.y };
  if (node.map === 'Main_GF') {
    campusPoint = {
      x: mainGroundToCampus.x[0] * node.x + mainGroundToCampus.x[1] * node.y + mainGroundToCampus.x[2],
      y: mainGroundToCampus.y[0] * node.x + mainGroundToCampus.y[1] * node.y + mainGroundToCampus.y[2],
    };
  } else if (node.map === 'Main_FF' || node.map === 'Main_SF') {
    const floorX = node.map === 'Main_SF' ? mainSecondOffsetX + node.x * mainSecondScaleX : node.x;
    const floorY = node.map === 'Main_SF' ? node.y + (247.1474 - 130.5021) : node.y;
    const groundX = mainFirstToGround.x[0] * floorX + mainFirstToGround.x[1] * floorY + mainFirstToGround.x[2];
    const groundY = mainFirstToGround.y[0] * floorX + mainFirstToGround.y[1] * floorY + mainFirstToGround.y[2];
    campusPoint = {
      x: mainGroundToCampus.x[0] * groundX + mainGroundToCampus.x[1] * groundY + mainGroundToCampus.x[2],
      y: mainGroundToCampus.y[0] * groundX + mainGroundToCampus.y[1] * groundY + mainGroundToCampus.y[2],
    };
  } else if (node.map === 'AI_GF' || node.map === 'AI_FF' || node.map === 'AI_SF') {
    const groundX = node.map === 'AI_GF' ? node.x : node.x + 93.7;
    const groundY = node.map === 'AI_GF' ? node.y : node.y + 168.1;
    campusPoint = {
      x: 331.918 + (groundX - 142.4783) * aiGroundScaleX,
      y: 159.0089 + (361.7772 - groundY) * aiGroundScaleY,
    };
  }
  return svgToGps(campusPoint);
}
