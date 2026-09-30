import fs from 'fs';
import { MongoClient } from 'mongodb';
import { CAMPUS_CALIBRATION_POINTS, svgToGps } from '../src/lib/geoProjection.ts';

// Affine transformations for floor plans to Campus Map SVG canvas
const gfToCampus = {
  X: [0.9907877085943264, -0.158691572146277, 53.87954672277097],
  Y: [0.00007081019858534013, 0.8483058951259533, 70.29782674887429]
};

const ffToGF = {
  X: [0.9152175152970835, -0.014621067142837148, 105.49871843122277],
  Y: [-0.008315712372633828, 0.9952873054065864, 24.098547956566012]
};

const sfScaleX = (673.8134 - 394.4221) / (707.2826 - 28.0434);
const sfOffsetX = 394.4221 - 28.0434 * sfScaleX;
const sfOffsetY = 247.1474 - 130.5021;

const aiGfScaleX = (522.8321 - 331.9180) / (753.2538 - 142.4783);
const aiGfScaleY = (243.9043 - 159.0089) / (361.7772 - 220.2832);

function computeNodeGeo(node: any): { lat: number; lng: number } {
  // Pinned ground-truth gates
  if (node.id === 'Main_Gate') {
    return { lat: CAMPUS_CALIBRATION_POINTS.mainGate.geo.lat, lng: CAMPUS_CALIBRATION_POINTS.mainGate.geo.lon };
  }
  if (node.id === 'New_Gate_Parking') {
    return { lat: CAMPUS_CALIBRATION_POINTS.newGateParking.geo.lat, lng: CAMPUS_CALIBRATION_POINTS.newGateParking.geo.lon };
  }
  if (node.id === 'Workshop_Gate') {
    return { lat: CAMPUS_CALIBRATION_POINTS.workshopGate.geo.lat, lng: CAMPUS_CALIBRATION_POINTS.workshopGate.geo.lon };
  }
  if (node.id === 'Jubilee_Gate') {
    return { lat: CAMPUS_CALIBRATION_POINTS.jubileeGate.geo.lat, lng: CAMPUS_CALIBRATION_POINTS.jubileeGate.geo.lon };
  }

  let cx = node.x;
  let cy = node.y;

  if (node.map === 'Campus_Map') {
    const geo = svgToGps({ x: cx, y: cy });
    return { lat: geo.lat, lng: geo.lon };
  }

  if (node.map === 'Main_GF') {
    cx = gfToCampus.X[0] * node.x + gfToCampus.X[1] * node.y + gfToCampus.X[2];
    cy = gfToCampus.Y[0] * node.x + gfToCampus.Y[1] * node.y + gfToCampus.Y[2];
    const geo = svgToGps({ x: cx, y: cy });
    return { lat: geo.lat, lng: geo.lon };
  }

  if (node.map === 'Main_FF') {
    const gfx = ffToGF.X[0] * node.x + ffToGF.X[1] * node.y + ffToGF.X[2];
    const gfy = ffToGF.Y[0] * node.x + ffToGF.Y[1] * node.y + ffToGF.Y[2];
    cx = gfToCampus.X[0] * gfx + gfToCampus.X[1] * gfy + gfToCampus.X[2];
    cy = gfToCampus.Y[0] * gfx + gfToCampus.Y[1] * gfy + gfToCampus.Y[2];
    const geo = svgToGps({ x: cx, y: cy });
    return { lat: geo.lat, lng: geo.lon };
  }

  if (node.map === 'Main_SF') {
    const ffx = sfOffsetX + node.x * sfScaleX;
    const ffy = sfOffsetY + node.y;
    const gfx = ffToGF.X[0] * ffx + ffToGF.X[1] * ffy + ffToGF.X[2];
    const gfy = ffToGF.Y[0] * ffx + ffToGF.Y[1] * ffy + ffToGF.Y[2];
    cx = gfToCampus.X[0] * gfx + gfToCampus.X[1] * gfy + gfToCampus.X[2];
    cy = gfToCampus.Y[0] * gfx + gfToCampus.Y[1] * gfy + gfToCampus.Y[2];
    const geo = svgToGps({ x: cx, y: cy });
    return { lat: geo.lat, lng: geo.lon };
  }

  if (node.map === 'AI_GF') {
    cx = 331.9180 + (node.x - 142.4783) * aiGfScaleX;
    cy = 159.0089 + (361.7772 - node.y) * aiGfScaleY;
    const geo = svgToGps({ x: cx, y: cy });
    return { lat: geo.lat, lng: geo.lon };
  }

  if (node.map === 'AI_FF' || node.map === 'AI_SF') {
    const gfx = node.x + 93.7;
    const gfy = node.y + 168.1;
    cx = 331.9180 + (gfx - 142.4783) * aiGfScaleX;
    cy = 159.0089 + (361.7772 - gfy) * aiGfScaleY;
    const geo = svgToGps({ x: cx, y: cy });
    return { lat: geo.lat, lng: geo.lon };
  }

  const geo = svgToGps({ x: cx, y: cy });
  return { lat: geo.lat, lng: geo.lon };
}

async function sync() {
  console.log('Reading nodes.json and edges.json...');
  const nodesPath = 'init-data/nodes.json';
  const edgesPath = 'init-data/edges.json';

  const nodes = JSON.parse(fs.readFileSync(nodesPath, 'utf8'));
  const edges = JSON.parse(fs.readFileSync(edgesPath, 'utf8'));

  // 1. Ensure New_Gate_Parking exists at exact bottom-right position
  let newGate = nodes.find((n: any) => n.id === 'New_Gate_Parking');
  if (!newGate) {
    newGate = {
      id: 'New_Gate_Parking',
      name: 'New Gate (Parking / Gate 2)',
      map: 'Campus_Map',
      x: 815.0,
      y: 606.1033,
      type: 'gate',
      category: 'campus',
      lat: CAMPUS_CALIBRATION_POINTS.newGateParking.geo.lat,
      lng: CAMPUS_CALIBRATION_POINTS.newGateParking.geo.lon,
      __v: 0,
    };
    nodes.push(newGate);
    console.log('Added New_Gate_Parking node.');
  } else {
    newGate.name = 'New Gate (Parking / Gate 2)';
    newGate.x = 815.0;
    newGate.y = 606.1033;
    newGate.lat = CAMPUS_CALIBRATION_POINTS.newGateParking.geo.lat;
    newGate.lng = CAMPUS_CALIBRATION_POINTS.newGateParking.geo.lon;
  }

  // 2. Ensure Workshop_Gate (Gate 3) exists at exact top-left position
  let workshopGate = nodes.find((n: any) => n.id === 'Workshop_Gate');
  if (!workshopGate) {
    workshopGate = {
      id: 'Workshop_Gate',
      name: 'Workshop Gate (Gate 3)',
      map: 'Campus_Map',
      x: 215.0,
      y: 128.4842,
      type: 'gate',
      category: 'campus',
      lat: CAMPUS_CALIBRATION_POINTS.workshopGate.geo.lat,
      lng: CAMPUS_CALIBRATION_POINTS.workshopGate.geo.lon,
      __v: 0,
    };
    nodes.push(workshopGate);
    console.log('Added Workshop_Gate node.');
  } else {
    workshopGate.name = 'Workshop Gate (Gate 3)';
    workshopGate.x = 215.0;
    workshopGate.y = 128.4842;
    workshopGate.lat = CAMPUS_CALIBRATION_POINTS.workshopGate.geo.lat;
    workshopGate.lng = CAMPUS_CALIBRATION_POINTS.workshopGate.geo.lon;
  }

  // 3. Connect New_Gate_Parking to JubileeRoad16 (x: 803.5, y: 556.0)
  const edgeNewGateId = 'edge_New_Gate_Parking_JubileeRoad16';
  let edgeNewGate = edges.find((e: any) => e.id === edgeNewGateId || (e.from_node === 'New_Gate_Parking' && e.to_node === 'JubileeRoad16'));
  if (!edgeNewGate) {
    edges.push({
      id: edgeNewGateId,
      from_node: 'New_Gate_Parking',
      to_node: 'JubileeRoad16',
      distance: 24.7,
      type: 'outdoor',
      category: 'campus',
      __v: 0,
    });
    console.log('Added edge New_Gate_Parking <-> JubileeRoad16');
  }

  // 4. Connect Workshop_Gate to MainRoad12 (x: 253.06, y: 128.48)
  const edgeWorkshopId = 'edge_Workshop_Gate_MainRoad12';
  let edgeWorkshop = edges.find((e: any) => e.id === edgeWorkshopId || (e.from_node === 'Workshop_Gate' && e.to_node === 'MainRoad12'));
  if (!edgeWorkshop) {
    edges.push({
      id: edgeWorkshopId,
      from_node: 'Workshop_Gate',
      to_node: 'MainRoad12',
      distance: 38.1,
      type: 'outdoor',
      category: 'campus',
      __v: 0,
    });
    console.log('Added edge Workshop_Gate <-> MainRoad12');
  }

  // 5. Compute lat & lng for EVERY single node
  let count = 0;
  for (const node of nodes) {
    const geo = computeNodeGeo(node);
    node.lat = geo.lat;
    node.lng = geo.lng;
    count++;
  }
  console.log(`Synchronized geocoordinates for all ${count} nodes.`);

  // Save updated JSON files
  fs.writeFileSync(nodesPath, JSON.stringify(nodes, null, 2), 'utf8');
  fs.writeFileSync(edgesPath, JSON.stringify(edges, null, 2), 'utf8');
  console.log(`Saved nodes.json (${nodes.length} nodes) and edges.json (${edges.length} edges).`);

  // Sync to MongoDB
  try {
    const client = new MongoClient('mongodb://127.0.0.1:27017');
    await client.connect();
    const db = client.db('UniMap');

    await db.collection('nodes').deleteMany({});
    await db.collection('nodes').insertMany(nodes);
    console.log('Successfully updated MongoDB "nodes" collection with geocoordinates for every node!');

    await db.collection('edges').deleteMany({});
    await db.collection('edges').insertMany(edges);
    console.log('Successfully updated MongoDB "edges" collection!');

    await client.close();
  } catch (err: any) {
    console.warn('MongoDB sync warning:', err.message);
  }
}

sync().catch(console.error);
