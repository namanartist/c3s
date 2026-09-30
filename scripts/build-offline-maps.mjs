// scripts/build-offline-maps.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const fallbackPath = path.join(rootDir, 'src/lib/mock-data/campusDataFallback.json');
const raw = fs.readFileSync(fallbackPath, 'utf8');
const data = JSON.parse(raw);

const publicMapsDir = path.join(rootDir, 'public/maps');
if (!fs.existsSync(publicMapsDir)) {
  fs.mkdirSync(publicMapsDir, { recursive: true });
}

const mapConfigs = {
  Campus_Map: {
    title: 'MITS Campus Master Plan',
    viewBox: { minX: 0, minY: 0, width: 1092.2019, height: 670.0992 },
    isCampus: true,
  },
  Main_GF: {
    title: 'Main Academic Building — Ground Floor',
    viewBox: { minX: 0, minY: 0, width: 848.4096, height: 609.5946 },
    building: 'Main Building',
    floor: 'Ground Floor',
  },
  Main_FF: {
    title: 'Main Academic Building — First Floor',
    viewBox: { minX: 0, minY: 0, width: 696.4, height: 576.6927 },
    building: 'Main Building',
    floor: 'First Floor',
  },
  Main_SF: {
    title: 'Main Academic Building — Second Floor',
    viewBox: { minX: 0, minY: 0, width: 743.9135, height: 482.3806 },
    building: 'Main Building',
    floor: 'Second Floor',
  },
  AI_GF: {
    title: 'AI & CSE Complex — Ground Floor',
    viewBox: { minX: 0, minY: 0, width: 842, height: 595 },
    building: 'AI & CSE Building',
    floor: 'Ground Floor',
  },
  AI_FF: {
    title: 'AI & CSE Complex — First Floor',
    viewBox: { minX: 0, minY: 0, width: 705.6, height: 283.32 },
    building: 'AI & CSE Building',
    floor: 'First Floor',
  },
  AI_SF: {
    title: 'AI & CSE Complex — Second Floor',
    viewBox: { minX: 0, minY: 0, width: 719.4, height: 220.32 },
    building: 'AI & CSE Building',
    floor: 'Second Floor',
  },
};

const nodesByMap = {};
for (const n of data.nodes) {
  if (!nodesByMap[n.map]) nodesByMap[n.map] = [];
  nodesByMap[n.map].push(n);
}

const nodeLookup = {};
for (const n of data.nodes) {
  nodeLookup[n.id] = n;
}

const edgesByMap = {};
for (const e of data.edges) {
  const fromNode = nodeLookup[e.from_node];
  const toNode = nodeLookup[e.to_node];
  if (fromNode && toNode && fromNode.map === toNode.map) {
    const mapId = fromNode.map;
    if (!edgesByMap[mapId]) edgesByMap[mapId] = [];
    edgesByMap[mapId].push({ edge: e, from: fromNode, to: toNode });
  }
}

for (const [mapId, cfg] of Object.entries(mapConfigs)) {
  const { minX, minY, width, height } = cfg.viewBox;
  const nodes = nodesByMap[mapId] || [];
  const edges = edgesByMap[mapId] || [];

  const rooms = nodes.filter((n) => n.type === 'room');
  const corridors = nodes.filter((n) => n.type === 'corridor');
  const stairs = nodes.filter((n) => n.type === 'stairs');
  const entries = nodes.filter((n) => n.type === 'entry');

  // Compute building hull / bounds from nodes
  let bMinX = width, bMaxX = 0, bMinY = height, bMaxY = 0;
  for (const n of nodes) {
    if (n.x < bMinX) bMinX = n.x;
    if (n.x > bMaxX) bMaxX = n.x;
    if (n.y < bMinY) bMinY = n.y;
    if (n.y > bMaxY) bMaxY = n.y;
  }
  const pad = 36;
  const boundX = Math.max(0, bMinX - pad);
  const boundY = Math.max(0, bMinY - pad);
  const boundW = Math.min(width - boundX, bMaxX - bMinX + pad * 2);
  const boundH = Math.min(height - boundY, bMaxY - bMinY + pad * 2);

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <!-- Architectural grid for light theme -->
    <pattern id="lightGrid_${mapId}" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" stroke-width="0.75" stroke-opacity="0.8"/>
      <circle cx="0" cy="0" r="1" fill="#94A3B8" fill-opacity="0.5"/>
    </pattern>
    <filter id="softShadow_${mapId}" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0F172A" flood-opacity="0.08" />
    </filter>
    <filter id="badgeShadow_${mapId}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.15" />
    </filter>
  </defs>

  <!-- Clean Light Canvas Background -->
  <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#F8FAFC"/>
  <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="url(#lightGrid_${mapId})"/>
`;

  if (cfg.isCampus) {
    // Campus Master Plan: Fresh manicured lawns, roadways, prominent building blocks
    svg += `
  <!-- Campus Green Zones & Sports Lawns -->
  <g>
    <!-- West Lawns -->
    <rect x="40" y="40" width="220" height="480" rx="18" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="2"/>
    <circle cx="150" cy="180" r="45" fill="#D1FAE5" stroke="#6EE7B7" stroke-width="1.5" stroke-dasharray="4,3"/>
    <text x="150" y="185" fill="#047857" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" text-anchor="middle">SPORTS ARENA</text>
    <text x="150" y="320" fill="#065F46" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" letter-spacing="1" text-anchor="middle">WEST LAWNS &amp; GROUNDS</text>
    
    <!-- East Campus Grounds -->
    <rect x="680" y="70" width="370" height="500" rx="18" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="2"/>
    <text x="865" y="320" fill="#15803D" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" letter-spacing="1" text-anchor="middle">EAST CAMPUS &amp; HOSTEL ZONE</text>
  </g>

  <!-- Campus Perimeter Boundary Line -->
  <rect x="25" y="25" width="${width - 50}" height="${height - 50}" rx="24" fill="none" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="8,6"/>

  <!-- Main Academic Building Block -->
  <g filter="url(#softShadow_${mapId})">
    <rect x="290" y="215" width="440" height="320" rx="16" fill="#FFFFFF" stroke="#3B82F6" stroke-width="2.5"/>
    <rect x="304" y="229" width="412" height="292" rx="12" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="1.5"/>
    
    <!-- Courtyard Accent -->
    <rect x="420" y="310" width="180" height="130" rx="10" fill="#E0F2FE" stroke="#BAE6FD" stroke-width="1.5"/>
    <text x="510" y="365" fill="#0284C7" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" text-anchor="middle">CENTRAL ATRIUM</text>
    <text x="510" y="382" fill="#0369A1" font-family="system-ui, -apple-system, sans-serif" font-size="9.5" font-weight="600" text-anchor="middle">Open Courtyard</text>

    <!-- Header Label -->
    <rect x="350" y="238" width="320" height="32" rx="8" fill="#1E40AF" />
    <text x="510" y="259" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" letter-spacing="1" text-anchor="middle">🏛️ MAIN ACADEMIC BUILDING</text>
    <text x="510" y="495" fill="#1E3A8A" font-family="system-ui, -apple-system, sans-serif" font-size="10.5" font-weight="700" text-anchor="middle">Colloquium • Conclave • SH-7 • Admin • Classrooms 101-140</text>
  </g>

  <!-- AI & CSE Building Block -->
  <g filter="url(#softShadow_${mapId})">
    <rect x="430" y="65" width="280" height="130" rx="14" fill="#FFFFFF" stroke="#8B5CF6" stroke-width="2.5"/>
    <rect x="440" y="75" width="260" height="110" rx="10" fill="#FAF5FF" stroke="#E9D5FF" stroke-width="1.5"/>
    
    <rect x="470" y="82" width="200" height="26" rx="6" fill="#6D28D9" />
    <text x="570" y="99" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" letter-spacing="1" text-anchor="middle">💻 AI &amp; CSE COMPLEX</text>
    <text x="570" y="145" fill="#581C87" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" text-anchor="middle">Computer Labs • Data Science • IT Center</text>
  </g>
`;
  } else {
    // Light Floor Plan Slab Outline with clean architectural walls
    svg += `
  <!-- Architectural Floor Outline & Slab Boundary -->
  <g filter="url(#softShadow_${mapId})">
    <rect x="${boundX}" y="${boundY}" width="${boundW}" height="${boundH}" rx="18" fill="#FFFFFF" stroke="#475569" stroke-width="2.5" />
    <rect x="${boundX + 6}" y="${boundY + 6}" width="${boundW - 12}" height="${boundH - 12}" rx="14" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" />
    
    <!-- Floor Banner Badge -->
    <rect x="${boundX + 16}" y="${boundY + 16}" width="260" height="36" rx="8" fill="#0F172A" />
    <text x="${boundX + 28}" y="${boundY + 39}" fill="#F8FAFC" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" letter-spacing="1">${cfg.building?.toUpperCase()} // ${cfg.floor?.toUpperCase()}</text>
  </g>
`;
  }

  // Render Corridor Edges as clean light asphalt / indoor walkways
  svg += `  <!-- Hallways and Walkway Corridors -->\n  <g>\n`;
  for (const item of edges) {
    const isCampus = cfg.isCampus;
    const outerWidth = isCampus ? 14 : 18;
    const innerWidth = isCampus ? 8 : 10;
    const outerColor = isCampus ? '#CBD5E1' : '#E2E8F0';
    const innerColor = isCampus ? '#FFFFFF' : '#FFFFFF';
    
    // Outer pathway foundation
    svg += `    <line x1="${item.from.x}" y1="${item.from.y}" x2="${item.to.x}" y2="${item.to.y}" stroke="${outerColor}" stroke-width="${outerWidth}" stroke-linecap="round" />\n`;
    // Clean walkable inner line
    svg += `    <line x1="${item.from.x}" y1="${item.from.y}" x2="${item.to.x}" y2="${item.to.y}" stroke="${innerColor}" stroke-width="${innerWidth}" stroke-linecap="round" />\n`;
    // Subtle centerline dash for direction
    svg += `    <line x1="${item.from.x}" y1="${item.from.y}" x2="${item.to.x}" y2="${item.to.y}" stroke="#94A3B8" stroke-width="1" stroke-dasharray="4,4" opacity="0.6" stroke-linecap="round" />\n`;
  }
  svg += `  </g>\n\n`;

  // Render Rooms as recognizable, readable, distinct architectural boxes with sharp high contrast
  svg += `  <!-- Rooms, Classrooms and Centers -->\n  <g>\n`;
  for (const r of rooms) {
    const rx = r.x;
    const ry = r.y;
    const cleanName = (r.name || r.id).replace(/[<>&"']/g, '');
    const isSpecial = cleanName.toLowerCase().includes('conclave') || 
                      cleanName.toLowerCase().includes('colloquium') || 
                      cleanName.toLowerCase().includes('sh-7') ||
                      cleanName.toLowerCase().includes('seminar') ||
                      cleanName.toLowerCase().includes('auditorium');
    const isLab = cleanName.toLowerCase().includes('lab') || cleanName.toLowerCase().includes('computer');
    
    let rectFill = '#FFFFFF';
    let rectStroke = '#3B82F6';
    let headerFill = '#EFF6FF';
    let textColor = '#0F172A';
    let accentDot = '#3B82F6';

    if (isSpecial) {
      rectFill = '#FFFBEB';
      rectStroke = '#F59E0B';
      headerFill = '#FDE68A';
      textColor = '#92400E';
      accentDot = '#D97706';
    } else if (isLab) {
      rectFill = '#FAF5FF';
      rectStroke = '#A855F7';
      headerFill = '#F3E8FF';
      textColor = '#581C87';
      accentDot = '#9333EA';
    }

    const w = isSpecial ? 54 : 46;
    const h = isSpecial ? 34 : 30;

    svg += `    <g id="node_${r.id}" transform="translate(${rx}, ${ry})" filter="url(#badgeShadow_${mapId})" class="map-node-group cursor-pointer">
      <rect x="-${w/2}" y="-${h/2}" width="${w}" height="${h}" rx="7" fill="${rectFill}" stroke="${rectStroke}" stroke-width="1.8" />
      <rect x="-${w/2 - 2}" y="-${h/2 - 2}" width="${w - 4}" height="10" rx="4" fill="${headerFill}" />
      <circle cx="0" cy="0" r="3" fill="${accentDot}" />
      <text x="0" y="${h/2 - 5}" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif" font-size="${isSpecial ? 8.5 : 8}" font-weight="700" text-anchor="middle">${cleanName.slice(0, 11)}</text>
    </g>\n`;
  }
  svg += `  </g>\n\n`;

  // Render Stairs and Elevators with recognizable purple-blue stairs badge
  svg += `  <!-- Vertical Stairs & Lifts -->\n  <g>\n`;
  for (const s of stairs) {
    const sx = s.x;
    const sy = s.y;
    const sName = (s.name || s.id).replace(/[<>&"']/g, '');
    svg += `    <g id="node_${s.id}" transform="translate(${sx}, ${sy})" filter="url(#badgeShadow_${mapId})" class="map-node-group cursor-pointer">
      <rect x="-16" y="-16" width="32" height="32" rx="8" fill="#F5F3FF" stroke="#7C3AED" stroke-width="2" />
      <path d="M-9 7 L-3 1 L3 1 L3 -5 L9 -5" fill="none" stroke="#6D28D9" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <text x="0" y="27" fill="#4C1D95" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" font-weight="800" text-anchor="middle">${sName.slice(0, 12)}</text>
    </g>\n`;
  }
  svg += `  </g>\n\n`;

  // Render Entry/Exit points & Campus Gates with high-visibility landmark pins
  svg += `  <!-- Entry Points and Campus Gates -->\n  <g>\n`;
  for (const ent of entries) {
    const ex = ent.x;
    const ey = ent.y;
    const entName = (ent.name || ent.id).replace(/[<>&"']/g, '');
    const isGate = entName.toLowerCase().includes('gate');

    if (isGate) {
      svg += `    <g id="node_${ent.id}" transform="translate(${ex}, ${ey})" filter="url(#badgeShadow_${mapId})">
      <circle cx="0" cy="0" r="16" fill="#1E293B" stroke="#0F172A" stroke-width="2.5" />
      <circle cx="0" cy="0" r="7" fill="#10B981" />
      <rect x="-65" y="20" width="130" height="24" rx="6" fill="#0F172A" />
      <text x="0" y="36" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="9.5" font-weight="800" letter-spacing="0.5" text-anchor="middle">🚪 ${entName.toUpperCase()}</text>
    </g>\n`;
    } else {
      svg += `    <g id="node_${ent.id}" transform="translate(${ex}, ${ey})" filter="url(#badgeShadow_${mapId})">
      <circle cx="0" cy="0" r="12" fill="#ECFDF5" stroke="#059669" stroke-width="2.5" />
      <circle cx="0" cy="0" r="5" fill="#10B981" />
      <rect x="-40" y="16" width="80" height="18" rx="5" fill="#065F46" />
      <text x="0" y="29" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" font-weight="800" text-anchor="middle">${entName.slice(0, 14)}</text>
    </g>\n`;
    }
  }
  svg += `  </g>\n\n`;

  // Map watermark badge
  svg += `  <!-- Clean Map Badge -->
  <g transform="translate(${minX + 24}, ${height - 38})">
    <rect width="210" height="26" rx="6" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2" filter="url(#badgeShadow_${mapId})"/>
    <circle cx="14" cy="13" r="4" fill="#10B981"/>
    <text x="26" y="17" fill="#334155" font-family="system-ui, -apple-system, sans-serif" font-size="10.5" font-weight="700">MITS GWALIOR • LIGHT THEME</text>
  </g>
</svg>`;

  const outPath = path.join(publicMapsDir, `${mapId}.svg`);
  fs.writeFileSync(outPath, svg, 'utf8');
  console.log(`Generated light-theme vector SVG: ${outPath} (${svg.length} bytes)`);
}

console.log('All 7 offline map SVGs generated successfully in public/maps/ (Clean Light Theme)');
