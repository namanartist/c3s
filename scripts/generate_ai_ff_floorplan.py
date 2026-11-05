# scripts/generate_ai_ff_floorplan.py
import os

svg_content = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 705.6 283.32" width="705.6" height="283.32">
  <defs>
    <!-- Architectural subtle grid -->
    <pattern id="lightGrid_AI_FF" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" stroke-width="0.5" stroke-opacity="0.6"/>
    </pattern>
    <filter id="softShadow_AI_FF" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#0F172A" flood-opacity="0.08" />
    </filter>
    <filter id="badgeShadow_AI_FF" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.15" />
    </filter>

    <!-- Hatching for staircases -->
    <pattern id="stairHatch" width="4" height="6" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="4" y2="0" stroke="#FCA5A5" stroke-width="1.2" />
    </pattern>

    <style>
      .map-node-group { display: none !important; }
      .room-label { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
    </style>
  </defs>

  <!-- Canvas Background -->
  <rect x="0" y="0" width="705.6" height="283.32" fill="#FFFFFF"/>
  <rect x="0" y="0" width="705.6" height="283.32" fill="url(#lightGrid_AI_FF)"/>

  <!-- ========================================== -->
  <!-- HEADER BAR (Matches attached design exactly)-->
  <!-- ========================================== -->
  <g id="header_bar">
    <!-- MITS Crest / Emblem -->
    <g transform="translate(18, 8)">
      <circle cx="16" cy="16" r="14" fill="#FEF3C7" stroke="#D97706" stroke-width="1.5" />
      <path d="M 16 6 L 24 14 L 20 25 L 12 25 L 8 14 Z" fill="#F59E0B" opacity="0.8" />
      <circle cx="16" cy="16" r="6" fill="#1E3A8A" />
      <circle cx="16" cy="16" r="3" fill="#FFFFFF" />
      <path d="M 10 27 Q 16 29 22 27" fill="none" stroke="#D97706" stroke-width="1.5" />
    </g>

    <!-- Institution Branding -->
    <text x="56" y="22" fill="#1E3A8A" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="900" letter-spacing="0.3">MITS Gwalior</text>
    <text x="56" y="32" fill="#64748B" font-family="system-ui, -apple-system, sans-serif" font-size="7.5" font-weight="600">Madhav Institute of Technology &amp; Science</text>

    <!-- Vertical Divider -->
    <line x1="192" y1="10" x2="192" y2="36" stroke="#CBD5E1" stroke-width="1.5" />

    <!-- Building & Floor Information -->
    <text x="204" y="22" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="900" letter-spacing="0.2">AI &amp; CSE Building</text>
    <text x="204" y="32" fill="#0284C7" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" font-weight="700">Floor Plan – First Floor</text>

    <!-- Right Side: First Floor Badge & North Arrow -->
    <g transform="translate(580, 10)">
      <rect x="0" y="0" width="78" height="26" rx="13" fill="#034B80" />
      <text x="39" y="17" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="10.5" font-weight="800" text-anchor="middle">First Floor</text>
    </g>

    <!-- Compass North Indicator -->
    <g transform="translate(674, 12)">
      <polygon points="12,0 7,16 12,12 17,16" fill="#0284C7" />
      <polygon points="12,12 7,16 12,24 17,16" fill="#64748B" opacity="0.6" />
      <text x="12" y="32" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="900" text-anchor="middle">N</text>
    </g>
  </g>

  <!-- ========================================== -->
  <!-- FLOOR SLAB & STRUCTURAL WALL ENVELOPE       -->
  <!-- ========================================== -->
  <g id="architectural_structure" filter="url(#softShadow_AI_FF)">
    <!-- Base slab -->
    <rect x="16" y="44" width="662" height="152" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.5" />

    <!-- Window cuts on outer perimeter (architectural double lines) -->
    <!-- Top outer windows -->
    <line x1="168" y1="44" x2="198" y2="44" stroke="#FFFFFF" stroke-width="3" />
    <line x1="230" y1="44" x2="260" y2="44" stroke="#FFFFFF" stroke-width="3" />
    <line x1="292" y1="44" x2="322" y2="44" stroke="#FFFFFF" stroke-width="3" />
    <line x1="504" y1="44" x2="534" y2="44" stroke="#FFFFFF" stroke-width="3" />
    <line x1="556" y1="44" x2="586" y2="44" stroke="#FFFFFF" stroke-width="3" />

    <!-- Bottom outer windows -->
    <line x1="40" y1="196" x2="70" y2="196" stroke="#FFFFFF" stroke-width="3" />
    <line x1="200" y1="196" x2="230" y2="196" stroke="#FFFFFF" stroke-width="3" />
    <line x1="252" y1="196" x2="282" y2="196" stroke="#FFFFFF" stroke-width="3" />
    <line x1="404" y1="196" x2="434" y2="196" stroke="#FFFFFF" stroke-width="3" />
    <line x1="456" y1="196" x2="486" y2="196" stroke="#FFFFFF" stroke-width="3" />
  </g>

  <!-- ========================================== -->
  <!-- TOP ROW ROOMS                              -->
  <!-- ========================================== -->
  <g id="top_row_rooms">
    <!-- Female Washroom -->
    <g id="visual_Female_WC">
      <rect x="18" y="46" width="34" height="56" fill="#FEE2E2" stroke="#FDA4AF" stroke-width="1.2" />
      <!-- Stalls -->
      <line x1="18" y1="64" x2="34" y2="64" stroke="#FDA4AF" stroke-width="1" />
      <line x1="18" y1="82" x2="34" y2="82" stroke="#FDA4AF" stroke-width="1" />
      <!-- Female icon (stylized silhouette) -->
      <circle cx="35" cy="74" r="2.5" fill="#E11D48" />
      <path d="M 32 84 L 35 77 L 38 84 Z" fill="#E11D48" />
      <text x="35" y="93" fill="#9F1239" font-family="system-ui, -apple-system, sans-serif" font-size="5" font-weight="700" text-anchor="middle">Female</text>
      <text x="35" y="98" fill="#9F1239" font-family="system-ui, -apple-system, sans-serif" font-size="4.5" font-weight="600" text-anchor="middle">Washroom</text>
      <!-- Door -->
      <path d="M 45 102 A 7 7 0 0 1 52 95" fill="none" stroke="#0F172A" stroke-width="1" />
      <line x1="52" y1="102" x2="52" y2="95" stroke="#0F172A" stroke-width="1" />
    </g>

    <!-- Male Washroom -->
    <g id="visual_Male_WC">
      <rect x="52" y="46" width="38" height="56" fill="#FEE2E2" stroke="#FDA4AF" stroke-width="1.2" />
      <!-- Urinals / stalls -->
      <line x1="52" y1="64" x2="68" y2="64" stroke="#FDA4AF" stroke-width="1" />
      <line x1="52" y1="82" x2="68" y2="82" stroke="#FDA4AF" stroke-width="1" />
      <!-- Male icon -->
      <circle cx="72" cy="74" r="2.5" fill="#E11D48" />
      <path d="M 69 78 L 75 78 L 74 85 L 70 85 Z" fill="#E11D48" />
      <text x="72" y="93" fill="#9F1239" font-family="system-ui, -apple-system, sans-serif" font-size="5" font-weight="700" text-anchor="middle">Male</text>
      <text x="72" y="98" fill="#9F1239" font-family="system-ui, -apple-system, sans-serif" font-size="4.5" font-weight="600" text-anchor="middle">Washroom</text>
      <!-- Door -->
      <path d="M 83 102 A 7 7 0 0 1 90 95" fill="none" stroke="#0F172A" stroke-width="1" />
      <line x1="90" y1="102" x2="90" y2="95" stroke="#0F172A" stroke-width="1" />
    </g>

    <!-- Left Staircase (Up / Down) -->
    <g id="visual_Left_Stairs">
      <rect x="90" y="46" width="42" height="56" fill="#FEE2E2" stroke="#F87171" stroke-width="1.2" />
      <rect x="92" y="48" width="38" height="52" fill="url(#stairHatch)" opacity="0.6" />
      <line x1="111" y1="46" x2="111" y2="102" stroke="#F87171" stroke-width="1" />
      <!-- Diagonal Up/Down Arrow -->
      <line x1="100" y1="88" x2="122" y2="60" stroke="#0F172A" stroke-width="1.5" />
      <polygon points="122,57 116,63 123,66" fill="#0F172A" />
      <text x="111" y="74" fill="#9F1239" font-family="system-ui, -apple-system, sans-serif" font-size="5" font-weight="800" text-anchor="middle">Staircase</text>
      <text x="111" y="80" fill="#9F1239" font-family="system-ui, -apple-system, sans-serif" font-size="4" font-weight="700" text-anchor="middle">(Up / Down)</text>
    </g>

    <!-- Decorative Screen Pattern -->
    <g id="visual_Screen" stroke="#0284C7" stroke-width="1" fill="none">
      <path d="M 134 50 L 140 56 L 134 62 L 140 68 L 134 74 L 140 80 L 134 86 L 140 92 L 134 98" />
      <path d="M 140 50 L 146 56 L 140 62 L 146 68 L 140 74 L 146 80 L 140 86 L 146 92 L 140 98" />
    </g>

    <!-- Classroom M104 -->
    <g id="visual_M104">
      <rect x="146" y="46" width="236" height="56" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.5" />
      
      <!-- Classroom Desk / Projector Icon -->
      <g transform="translate(254, 58)">
        <rect x="2" y="0" width="16" height="3" rx="1.5" fill="#0284C7" />
        <rect x="0" y="5" width="20" height="2" rx="1" fill="#38BDF8" />
        <circle cx="5" cy="11" r="2" fill="#0284C7" />
        <circle cx="10" cy="11" r="2" fill="#0284C7" />
        <circle cx="15" cy="11" r="2" fill="#0284C7" />
      </g>

      <!-- Room Title -->
      <text x="264" y="82" fill="#034B80" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="900" letter-spacing="0.5" text-anchor="middle">M104</text>
      
      <!-- Double Doors Opening to Corridor -->
      <path d="M 238 102 A 8 8 0 0 1 246 94" fill="none" stroke="#0F172A" stroke-width="1.2" />
      <line x1="246" y1="102" x2="246" y2="94" stroke="#0F172A" stroke-width="1.2" />
      <path d="M 254 102 A 8 8 0 0 0 246 94" fill="none" stroke="#0F172A" stroke-width="1.2" />
      
      <path d="M 330 102 A 8 8 0 0 1 338 94" fill="none" stroke="#0F172A" stroke-width="1.2" />
      <line x1="338" y1="102" x2="338" y2="94" stroke="#0F172A" stroke-width="1.2" />
      <path d="M 346 102 A 8 8 0 0 0 338 94" fill="none" stroke="#0F172A" stroke-width="1.2" />
    </g>

    <!-- Utility / Service: Lift - 1 and Lift - 2 -->
    <g id="visual_Lifts">
      <rect x="408" y="46" width="28" height="56" fill="#EDE9FE" stroke="#7C3AED" stroke-width="1.5" />
      <line x1="408" y1="74" x2="436" y2="74" stroke="#7C3AED" stroke-width="1.5" />
      
      <!-- Lift - 1 -->
      <rect x="413" y="50" width="18" height="20" rx="3" fill="#7C3AED" />
      <text x="422" y="59" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="5" font-weight="900" text-anchor="middle">⯅ ⯆</text>
      <text x="422" y="66" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="4.5" font-weight="800" text-anchor="middle">Lift - 1</text>
      
      <!-- Lift - 2 -->
      <rect x="413" y="78" width="18" height="20" rx="3" fill="#7C3AED" />
      <text x="422" y="87" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="5" font-weight="900" text-anchor="middle">⯅ ⯆</text>
      <text x="422" y="94" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="4.5" font-weight="800" text-anchor="middle">Lift - 2</text>

      <!-- Lift entrance door arc -->
      <path d="M 408 96 A 6 6 0 0 1 402 102" fill="none" stroke="#0F172A" stroke-width="1" />
    </g>

    <!-- Center Staircase (Up / Down) -->
    <g id="visual_Center_Stairs">
      <rect x="436" y="46" width="42" height="56" fill="#FEE2E2" stroke="#F87171" stroke-width="1.2" />
      <rect x="438" y="48" width="38" height="52" fill="url(#stairHatch)" opacity="0.6" />
      <line x1="457" y1="46" x2="457" y2="102" stroke="#F87171" stroke-width="1" />
      <line x1="446" y1="88" x2="468" y2="60" stroke="#0F172A" stroke-width="1.5" />
      <polygon points="468,57 462,63 469,66" fill="#0F172A" />
      <text x="457" y="74" fill="#9F1239" font-family="system-ui, -apple-system, sans-serif" font-size="5" font-weight="800" text-anchor="middle">Staircase</text>
      <text x="457" y="80" fill="#9F1239" font-family="system-ui, -apple-system, sans-serif" font-size="4" font-weight="700" text-anchor="middle">(Up / Down)</text>
    </g>

    <!-- Classroom M101 -->
    <g id="visual_M101">
      <rect x="478" y="46" width="124" height="56" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.5" />
      
      <!-- Classroom Desk Icon -->
      <g transform="translate(530, 58)">
        <rect x="2" y="0" width="16" height="3" rx="1.5" fill="#0284C7" />
        <rect x="0" y="5" width="20" height="2" rx="1" fill="#38BDF8" />
        <circle cx="5" cy="11" r="2" fill="#0284C7" />
        <circle cx="10" cy="11" r="2" fill="#0284C7" />
        <circle cx="15" cy="11" r="2" fill="#0284C7" />
      </g>

      <!-- Room Title -->
      <text x="540" y="82" fill="#034B80" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="900" letter-spacing="0.5" text-anchor="middle">M101</text>
      
      <!-- Indoor plants decoration -->
      <g transform="translate(588, 54)">
        <circle cx="5" cy="8" r="3" fill="#22C55E" />
        <circle cx="5" cy="16" r="3.5" fill="#16A34A" />
        <circle cx="5" cy="24" r="3" fill="#22C55E" />
        <circle cx="5" cy="32" r="3.5" fill="#16A34A" />
        <rect x="3.5" y="37" width="3" height="4" fill="#B45309" />
      </g>

      <!-- Double Doors Opening to Corridor -->
      <path d="M 506 102 A 8 8 0 0 1 514 94" fill="none" stroke="#0F172A" stroke-width="1.2" />
      <line x1="514" y1="102" x2="514" y2="94" stroke="#0F172A" stroke-width="1.2" />
      <path d="M 522 102 A 8 8 0 0 0 514 94" fill="none" stroke="#0F172A" stroke-width="1.2" />
    </g>
  </g>

  <!-- ========================================== -->
  <!-- CENTRAL CORRIDOR                           -->
  <!-- ========================================== -->
  <g id="central_corridor">
    <!-- Corridor Walkway Path -->
    <rect x="18" y="102" width="584" height="22" fill="#F8FAFC" />

    <!-- Dashed circulation centerline -->
    <line x1="28" y1="113" x2="596" y2="113" stroke="#2563EB" stroke-width="1" stroke-dasharray="6,4" />

    <!-- Directional arrows -->
    <text x="108" y="115" fill="#1E40AF" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="900" text-anchor="middle">← ←</text>
    <text x="330" y="115" fill="#1E3A8A" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" font-weight="800" text-anchor="middle">Corridor (First Floor)</text>
    <text x="560" y="115" fill="#1E40AF" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="900" text-anchor="middle">→ →</text>
  </g>

  <!-- ========================================== -->
  <!-- BOTTOM ROW ROOMS                           -->
  <!-- ========================================== -->
  <g id="bottom_row_rooms">
    <!-- Classroom M105 -->
    <g id="visual_M105">
      <rect x="18" y="124" width="118" height="72" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.5" />
      
      <!-- Classroom Desk Icon -->
      <g transform="translate(67, 136)">
        <rect x="2" y="0" width="16" height="3" rx="1.5" fill="#0284C7" />
        <rect x="0" y="5" width="20" height="2" rx="1" fill="#38BDF8" />
        <circle cx="5" cy="11" r="2" fill="#0284C7" />
        <circle cx="10" cy="11" r="2" fill="#0284C7" />
        <circle cx="15" cy="11" r="2" fill="#0284C7" />
      </g>

      <text x="77" y="160" fill="#034B80" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="900" letter-spacing="0.5" text-anchor="middle">M105</text>
      
      <!-- Double Doors Opening to Corridor -->
      <path d="M 88 124 A 8 8 0 0 1 96 132" fill="none" stroke="#0F172A" stroke-width="1.2" />
      <line x1="96" y1="124" x2="96" y2="132" stroke="#0F172A" stroke-width="1.2" />
      <path d="M 104 124 A 8 8 0 0 0 96 132" fill="none" stroke="#0F172A" stroke-width="1.2" />
    </g>

    <!-- Partition Wall & Dimension Marker: 4730 -->
    <g id="visual_dimension_4730">
      <!-- Green dividing strip -->
      <rect x="136" y="124" width="4" height="72" fill="#16A34A" />
      
      <!-- Dimension line with arrow heads -->
      <line x1="140" y1="184" x2="182" y2="184" stroke="#DC2626" stroke-width="1" />
      <polygon points="140,184 145,182 145,186" fill="#DC2626" />
      <polygon points="182,184 177,182 177,186" fill="#DC2626" />
      <text x="161" y="180" fill="#DC2626" font-family="system-ui, -apple-system, sans-serif" font-size="6.5" font-weight="800" text-anchor="middle">4730</text>
      
      <!-- Indoor plant divider -->
      <g transform="translate(182, 126)">
        <circle cx="4" cy="10" r="2.5" fill="#22C55E" />
        <circle cx="4" cy="16" r="2.5" fill="#16A34A" />
        <circle cx="4" cy="22" r="2.5" fill="#22C55E" />
      </g>
    </g>

    <!-- Classroom M103 -->
    <g id="visual_M103">
      <rect x="182" y="124" width="144" height="72" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.5" />
      
      <!-- Classroom Desk Icon -->
      <g transform="translate(244, 136)">
        <rect x="2" y="0" width="16" height="3" rx="1.5" fill="#0284C7" />
        <rect x="0" y="5" width="20" height="2" rx="1" fill="#38BDF8" />
        <circle cx="5" cy="11" r="2" fill="#0284C7" />
        <circle cx="10" cy="11" r="2" fill="#0284C7" />
        <circle cx="15" cy="11" r="2" fill="#0284C7" />
      </g>

      <text x="254" y="160" fill="#034B80" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="900" letter-spacing="0.5" text-anchor="middle">M103</text>
      
      <!-- Double Doors Opening to Corridor -->
      <path d="M 276 124 A 8 8 0 0 1 284 132" fill="none" stroke="#0F172A" stroke-width="1.2" />
      <line x1="284" y1="124" x2="284" y2="132" stroke="#0F172A" stroke-width="1.2" />
      <path d="M 292 124 A 8 8 0 0 0 284 132" fill="none" stroke="#0F172A" stroke-width="1.2" />
    </g>

    <!-- Classroom M102 -->
    <g id="visual_M102">
      <rect x="382" y="124" width="124" height="72" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.5" />
      
      <!-- Classroom Desk Icon -->
      <g transform="translate(434, 136)">
        <rect x="2" y="0" width="16" height="3" rx="1.5" fill="#0284C7" />
        <rect x="0" y="5" width="20" height="2" rx="1" fill="#38BDF8" />
        <circle cx="5" cy="11" r="2" fill="#0284C7" />
        <circle cx="10" cy="11" r="2" fill="#0284C7" />
        <circle cx="15" cy="11" r="2" fill="#0284C7" />
      </g>

      <text x="444" y="160" fill="#034B80" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="900" letter-spacing="0.5" text-anchor="middle">M102</text>
      
      <!-- Double Doors Opening to Corridor -->
      <path d="M 396 124 A 8 8 0 0 1 404 132" fill="none" stroke="#0F172A" stroke-width="1.2" />
      <line x1="404" y1="124" x2="404" y2="132" stroke="#0F172A" stroke-width="1.2" />
      <path d="M 412 124 A 8 8 0 0 0 404 132" fill="none" stroke="#0F172A" stroke-width="1.2" />
    </g>

    <!-- Faculty Cabins / Office (Bottom Right Suite) -->
    <g id="visual_Faculty_Cabins_Bottom">
      <!-- Dr. Archana Acharya -->
      <rect x="506" y="124" width="40" height="72" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.2" />
      <text x="526" y="148" fill="#14532D" font-family="system-ui, -apple-system, sans-serif" font-size="5" font-weight="800" text-anchor="middle">Dr. Archana</text>
      <text x="526" y="156" fill="#14532D" font-family="system-ui, -apple-system, sans-serif" font-size="5" font-weight="800" text-anchor="middle">Acharya</text>
      <!-- Door -->
      <path d="M 510 124 A 6 6 0 0 1 516 130" fill="none" stroke="#0F172A" stroke-width="1" />

      <!-- Dr. Abhishek Rout (HOD, CST) -->
      <rect x="546" y="124" width="34" height="48" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.2" />
      <text x="563" y="138" fill="#14532D" font-family="system-ui, -apple-system, sans-serif" font-size="4.5" font-weight="800" text-anchor="middle">Dr. Abhishek</text>
      <text x="563" y="145" fill="#14532D" font-family="system-ui, -apple-system, sans-serif" font-size="4.5" font-weight="800" text-anchor="middle">Rout</text>
      <text x="563" y="152" fill="#15803D" font-family="system-ui, -apple-system, sans-serif" font-size="4" font-weight="700" text-anchor="middle">(HOD, CST)</text>
      <!-- Door -->
      <path d="M 552 124 A 6 6 0 0 1 558 130" fill="none" stroke="#0F172A" stroke-width="1" />

      <!-- Dr. Neeraj Mishra -->
      <rect x="580" y="124" width="32" height="34" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.2" />
      <text x="596" y="138" fill="#14532D" font-family="system-ui, -apple-system, sans-serif" font-size="4.5" font-weight="800" text-anchor="middle">Dr. Neeraj</text>
      <text x="596" y="145" fill="#14532D" font-family="system-ui, -apple-system, sans-serif" font-size="4.5" font-weight="800" text-anchor="middle">Mishra</text>
      <!-- Door -->
      <path d="M 584 124 A 5 5 0 0 1 589 129" fill="none" stroke="#0F172A" stroke-width="1" />

      <!-- Dr. Prerna Tej Singh -->
      <rect x="572" y="158" width="40" height="38" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.2" />
      <text x="592" y="172" fill="#14532D" font-family="system-ui, -apple-system, sans-serif" font-size="4.5" font-weight="800" text-anchor="middle">Dr. Prerna</text>
      <text x="592" y="179" fill="#14532D" font-family="system-ui, -apple-system, sans-serif" font-size="4.5" font-weight="800" text-anchor="middle">Tej Singh</text>
    </g>
  </g>

  <!-- ========================================== -->
  <!-- RIGHT-HAND FACULTY CABIN WING              -->
  <!-- ========================================== -->
  <g id="right_faculty_wing">
    <!-- Dr. Anu Sejal -->
    <rect x="622" y="46" width="56" height="30" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.2" />
    <text x="650" y="64" fill="#14532D" font-family="system-ui, -apple-system, sans-serif" font-size="6" font-weight="800" text-anchor="middle">Dr. Anu Sejal</text>
    <path d="M 622 56 A 6 6 0 0 1 628 50" fill="none" stroke="#0F172A" stroke-width="1" />

    <!-- Shubha Mehra -->
    <rect x="622" y="76" width="56" height="30" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.2" />
    <text x="650" y="94" fill="#14532D" font-family="system-ui, -apple-system, sans-serif" font-size="6" font-weight="800" text-anchor="middle">Shubha Mehra</text>
    <path d="M 622 86 A 6 6 0 0 1 628 80" fill="none" stroke="#0F172A" stroke-width="1" />

    <!-- Dr. Hardeep Singh Pal -->
    <rect x="622" y="106" width="56" height="30" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.2" />
    <text x="650" y="120" fill="#14532D" font-family="system-ui, -apple-system, sans-serif" font-size="5" font-weight="800" text-anchor="middle">Dr. Hardeep</text>
    <text x="650" y="127" fill="#14532D" font-family="system-ui, -apple-system, sans-serif" font-size="5" font-weight="800" text-anchor="middle">Singh Pal</text>
    <path d="M 622 116 A 6 6 0 0 1 628 110" fill="none" stroke="#0F172A" stroke-width="1" />

    <!-- Dr. Bhagat S. Raghuwanshi -->
    <rect x="622" y="136" width="56" height="30" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.2" />
    <text x="650" y="150" fill="#14532D" font-family="system-ui, -apple-system, sans-serif" font-size="5" font-weight="800" text-anchor="middle">Dr. Bhagat S.</text>
    <text x="650" y="157" fill="#14532D" font-family="system-ui, -apple-system, sans-serif" font-size="5" font-weight="800" text-anchor="middle">Raghuwanshi</text>
    <path d="M 622 146 A 6 6 0 0 1 628 140" fill="none" stroke="#0F172A" stroke-width="1" />

    <!-- Dr. Pawan Dubey -->
    <rect x="622" y="166" width="56" height="30" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.2" />
    <text x="650" y="184" fill="#14532D" font-family="system-ui, -apple-system, sans-serif" font-size="5.5" font-weight="800" text-anchor="middle">Dr. Pawan Dubey</text>
    <path d="M 622 176 A 6 6 0 0 1 628 170" fill="none" stroke="#0F172A" stroke-width="1" />
  </g>

  <!-- ========================================== -->
  <!-- STRUCTURAL COLUMNS (Navy Blue Pillars)     -->
  <!-- ========================================== -->
  <g id="structural_columns" fill="#1E3A8A">
    <!-- Top outer line columns -->
    <rect x="14" y="42" width="7" height="7" rx="1" />
    <rect x="50" y="42" width="6" height="6" rx="1" />
    <rect x="88" y="42" width="6" height="6" rx="1" />
    <rect x="132" y="42" width="6" height="6" rx="1" />
    <rect x="144" y="42" width="6" height="6" rx="1" />
    <rect x="204" y="42" width="6" height="6" rx="1" />
    <rect x="264" y="42" width="6" height="6" rx="1" />
    <rect x="324" y="42" width="6" height="6" rx="1" />
    <rect x="380" y="42" width="6" height="6" rx="1" />
    <rect x="406" y="42" width="6" height="6" rx="1" />
    <rect x="434" y="42" width="6" height="6" rx="1" />
    <rect x="476" y="42" width="6" height="6" rx="1" />
    <rect x="536" y="42" width="6" height="6" rx="1" />
    <rect x="600" y="42" width="6" height="6" rx="1" />
    <rect x="620" y="42" width="6" height="6" rx="1" />
    <rect x="674" y="42" width="7" height="7" rx="1" />

    <!-- Mid corridor line columns (top corridor wall) -->
    <rect x="14" y="100" width="7" height="7" rx="1" />
    <rect x="132" y="100" width="6" height="6" rx="1" />
    <rect x="144" y="100" width="6" height="6" rx="1" />
    <rect x="204" y="100" width="6" height="6" rx="1" />
    <rect x="264" y="100" width="6" height="6" rx="1" />
    <rect x="324" y="100" width="6" height="6" rx="1" />
    <rect x="380" y="100" width="6" height="6" rx="1" />
    <rect x="406" y="100" width="6" height="6" rx="1" />
    <rect x="434" y="100" width="6" height="6" rx="1" />
    <rect x="476" y="100" width="6" height="6" rx="1" />
    <rect x="536" y="100" width="6" height="6" rx="1" />
    <rect x="600" y="100" width="6" height="6" rx="1" />
    <rect x="674" y="100" width="7" height="7" rx="1" />

    <!-- Mid corridor line columns (bottom corridor wall) -->
    <rect x="14" y="122" width="7" height="7" rx="1" />
    <rect x="134" y="122" width="6" height="6" rx="1" />
    <rect x="180" y="122" width="6" height="6" rx="1" />
    <rect x="240" y="122" width="6" height="6" rx="1" />
    <rect x="324" y="122" width="6" height="6" rx="1" />
    <rect x="380" y="122" width="6" height="6" rx="1" />
    <rect x="504" y="122" width="6" height="6" rx="1" />
    <rect x="544" y="122" width="6" height="6" rx="1" />
    <rect x="610" y="122" width="6" height="6" rx="1" />

    <!-- Bottom outer line columns -->
    <rect x="14" y="193" width="7" height="7" rx="1" />
    <rect x="134" y="193" width="6" height="6" rx="1" />
    <rect x="180" y="193" width="6" height="6" rx="1" />
    <rect x="240" y="193" width="6" height="6" rx="1" />
    <rect x="324" y="193" width="6" height="6" rx="1" />
    <rect x="380" y="193" width="6" height="6" rx="1" />
    <rect x="440" y="193" width="6" height="6" rx="1" />
    <rect x="504" y="193" width="6" height="6" rx="1" />
    <rect x="570" y="193" width="6" height="6" rx="1" />
    <rect x="610" y="193" width="6" height="6" rx="1" />
    <rect x="674" y="193" width="7" height="7" rx="1" />
  </g>

  <!-- ========================================== -->
  <!-- BOTTOM ARCHITECTURAL LEGEND (Identical)    -->
  <!-- ========================================== -->
  <g id="bottom_legend" transform="translate(18, 246)">
    <!-- Border card for legend -->
    <rect x="0" y="0" width="662" height="28" rx="8" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.2" />

    <!-- "Legend |" Label -->
    <text x="14" y="17" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="900">Legend  |</text>

    <!-- Item 1: Classroom -->
    <g transform="translate(82, 7)">
      <rect x="0" y="0" width="16" height="14" rx="2" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.2" />
      <text x="22" y="10" fill="#334155" font-family="system-ui, -apple-system, sans-serif" font-size="7.5" font-weight="600">Classroom (M101 – M105)</text>
    </g>

    <!-- Item 2: Faculty Cabin / Office -->
    <g transform="translate(204, 7)">
      <rect x="0" y="0" width="16" height="14" rx="2" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.2" />
      <text x="22" y="10" fill="#334155" font-family="system-ui, -apple-system, sans-serif" font-size="7.5" font-weight="600">Faculty Cabin / Office</text>
    </g>

    <!-- Item 3: Washroom -->
    <g transform="translate(314, 7)">
      <rect x="0" y="0" width="16" height="14" rx="2" fill="#FEE2E2" stroke="#EF4444" stroke-width="1.2" />
      <text x="22" y="10" fill="#334155" font-family="system-ui, -apple-system, sans-serif" font-size="7.5" font-weight="600">Washroom</text>
    </g>

    <!-- Item 4: Utility / Service -->
    <g transform="translate(390, 7)">
      <rect x="0" y="0" width="16" height="14" rx="2" fill="#EDE9FE" stroke="#7C3AED" stroke-width="1.2" />
      <text x="22" y="10" fill="#334155" font-family="system-ui, -apple-system, sans-serif" font-size="7.5" font-weight="600">Utility / Service</text>
    </g>

    <!-- Item 5: Corridor / Circulation -->
    <g transform="translate(476, 7)">
      <line x1="0" y1="7" x2="16" y2="7" stroke="#2563EB" stroke-width="1.5" stroke-dasharray="3,2" />
      <text x="22" y="10" fill="#334155" font-family="system-ui, -apple-system, sans-serif" font-size="7.5" font-weight="600">Corridor / Circulation</text>
    </g>

    <!-- Item 6: Staircase -->
    <g transform="translate(568, 7)">
      <rect x="0" y="0" width="14" height="14" rx="2" fill="#FEE2E2" stroke="#F87171" stroke-width="1.2" />
      <line x1="2" y1="12" x2="12" y2="2" stroke="#0F172A" stroke-width="1" />
      <text x="20" y="6" fill="#334155" font-family="system-ui, -apple-system, sans-serif" font-size="6" font-weight="700">Staircase</text>
      <text x="20" y="12" fill="#64748B" font-family="system-ui, -apple-system, sans-serif" font-size="5" font-weight="600">(Up / Down)</text>
    </g>

    <!-- Item 7: Lift -->
    <g transform="translate(628, 7)">
      <rect x="0" y="0" width="12" height="14" rx="2" fill="#7C3AED" />
      <text x="6" y="8" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="4" font-weight="800" text-anchor="middle">⯅</text>
      <text x="6" y="12" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="4" font-weight="800" text-anchor="middle">⯆</text>
    </g>
  </g>

  <!-- ======================================================= -->
  <!-- UNIMAP INTERACTIVE PIN NODES (Exact Coordinates Match)  -->
  <!-- ======================================================= -->
  <g id="unimap_interactive_nodes">
    <g id="node_room_AI_FF_FemWC" transform="translate(50.4287, 85.653)" filter="url(#badgeShadow_AI_FF)" class="map-node-group cursor-pointer">
      <rect x="-23" y="-15" width="46" height="30" rx="7" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1.8" />
      <text x="0" y="10" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="700" text-anchor="middle">Female WC</text>
    </g>
    <g id="node_room_AI_FF_MaleWC" transform="translate(87.9231, 85.653)" filter="url(#badgeShadow_AI_FF)" class="map-node-group cursor-pointer">
      <rect x="-23" y="-15" width="46" height="30" rx="7" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1.8" />
      <text x="0" y="10" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="700" text-anchor="middle">Male WC</text>
    </g>
    <g id="node_AI_FF_Stairs02" transform="translate(130.9722, 92.4356)" filter="url(#badgeShadow_AI_FF)" class="map-node-group cursor-pointer">
      <rect x="-23" y="-15" width="46" height="30" rx="7" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1.8" />
      <text x="0" y="10" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="700" text-anchor="middle">Stairs 02</text>
    </g>
    <g id="node_room_AI_FF_M104" transform="translate(281.16, 91.8)" filter="url(#badgeShadow_AI_FF)" class="map-node-group cursor-pointer">
      <rect x="-23" y="-15" width="46" height="30" rx="7" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1.8" />
      <text x="0" y="10" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="700" text-anchor="middle">M104</text>
    </g>
    <g id="node_AI_FF_Stairs01" transform="translate(495.12, 92.52)" filter="url(#badgeShadow_AI_FF)" class="map-node-group cursor-pointer">
      <rect x="-23" y="-15" width="46" height="30" rx="7" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1.8" />
      <text x="0" y="10" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="700" text-anchor="middle">Stairs 01</text>
    </g>
    <g id="node_room_AI_FF_M101" transform="translate(539.4, 91.8)" filter="url(#badgeShadow_AI_FF)" class="map-node-group cursor-pointer">
      <rect x="-23" y="-15" width="46" height="30" rx="7" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1.8" />
      <text x="0" y="10" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="700" text-anchor="middle">M101</text>
    </g>
    <g id="node_room_AI_FF_M105" transform="translate(128.28, 116.64)" filter="url(#badgeShadow_AI_FF)" class="map-node-group cursor-pointer">
      <rect x="-23" y="-15" width="46" height="30" rx="7" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1.8" />
      <text x="0" y="10" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="700" text-anchor="middle">M105</text>
    </g>
    <g id="node_room_AI_FF_M103" transform="translate(282.12, 116.64)" filter="url(#badgeShadow_AI_FF)" class="map-node-group cursor-pointer">
      <rect x="-23" y="-15" width="46" height="30" rx="7" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1.8" />
      <text x="0" y="10" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="700" text-anchor="middle">M103</text>
    </g>
    <g id="node_room_AI_FF_M102" transform="translate(419.28, 116.64)" filter="url(#badgeShadow_AI_FF)" class="map-node-group cursor-pointer">
      <rect x="-23" y="-15" width="46" height="30" rx="7" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1.8" />
      <text x="0" y="10" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="700" text-anchor="middle">M102</text>
    </g>
    <g id="node_cabin_AI_FF_Dr_Archana_Prerna" transform="translate(557.88, 116.64)" filter="url(#badgeShadow_AI_FF)" class="map-node-group cursor-pointer">
      <rect x="-23" y="-15" width="46" height="30" rx="7" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1.8" />
      <text x="0" y="10" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="700" text-anchor="middle">Dr. Archana</text>
    </g>
    <g id="node_cabin_AI_FF_Dr_Rajni_HOD_AI" transform="translate(586.547, 116.64)" filter="url(#badgeShadow_AI_FF)" class="map-node-group cursor-pointer">
      <rect x="-23" y="-15" width="46" height="30" rx="7" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1.8" />
      <text x="0" y="10" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="700" text-anchor="middle">HOD CST</text>
    </g>
    <g id="node_cabin_AI_FF_Dr_Neeraj_Mishra" transform="translate(629.82, 140.8709)" filter="url(#badgeShadow_AI_FF)" class="map-node-group cursor-pointer">
      <rect x="-23" y="-15" width="46" height="30" rx="7" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1.8" />
      <text x="0" y="10" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="700" text-anchor="middle">Dr. Neeraj</text>
    </g>
    <g id="node_cabin_AI_FF_Dr_Tej_Singh" transform="translate(629.82, 151.1614)" filter="url(#badgeShadow_AI_FF)" class="map-node-group cursor-pointer">
      <rect x="-23" y="-15" width="46" height="30" rx="7" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1.8" />
      <text x="0" y="10" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="700" text-anchor="middle">Dr. Tej Singh</text>
    </g>
    <g id="node_cabin_AI_FF_Dr_Anu_Sayal" transform="translate(635.2318, 50.8558)" filter="url(#badgeShadow_AI_FF)" class="map-node-group cursor-pointer">
      <rect x="-23" y="-15" width="46" height="30" rx="7" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1.8" />
      <text x="0" y="10" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="700" text-anchor="middle">Dr. Anu Sejal</text>
    </g>
    <g id="node_cabin_AI_FF_Shubha_Mishra" transform="translate(658.6461, 56.3052)" filter="url(#badgeShadow_AI_FF)" class="map-node-group cursor-pointer">
      <rect x="-23" y="-15" width="46" height="30" rx="7" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1.8" />
      <text x="0" y="10" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="700" text-anchor="middle">Shubha Mehra</text>
    </g>
    <g id="node_cabin_AI_FF_Dr_Hardev_Pal" transform="translate(658.6461, 116.64)" filter="url(#badgeShadow_AI_FF)" class="map-node-group cursor-pointer">
      <rect x="-23" y="-15" width="46" height="30" rx="7" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1.8" />
      <text x="0" y="10" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="700" text-anchor="middle">Dr. Hardeep Pal</text>
    </g>
    <g id="node_cabin_AI_FF_Dr_Bhagat_Raghuwanshi" transform="translate(658.6461, 127.1259)" filter="url(#badgeShadow_AI_FF)" class="map-node-group cursor-pointer">
      <rect x="-23" y="-15" width="46" height="30" rx="7" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1.8" />
      <text x="0" y="10" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="700" text-anchor="middle">Dr. Bhagat S.</text>
    </g>
    <g id="node_cabin_AI_FF_Dr_Pawan_Dubey" transform="translate(635.2318, 157.3922)" filter="url(#badgeShadow_AI_FF)" class="map-node-group cursor-pointer">
      <rect x="-23" y="-15" width="46" height="30" rx="7" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1.8" />
      <text x="0" y="10" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="700" text-anchor="middle">Dr. Pawan Dubey</text>
    </g>
  </g>
</svg>
"""

with open('public/maps/AI_FF.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content.strip())

print("Successfully written architectural SVG to public/maps/AI_FF.svg")

