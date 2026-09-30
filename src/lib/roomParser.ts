// src/lib/roomParser.ts
const CATEGORIES: Array<[RegExp, string]> = [
  [/Lab/i, 'Lab'],
  [/Office|Dean|HOD|Department|Dr\.|Prof\.|Ar\./i, 'Office'],
  [/Studio/i, 'Studio'],
  [/LT-|Lecture/i, 'Classroom'],
  [/Washroom/i, 'Washroom'],
  [/SH-|^PL-/, 'Common'],
  [/Centre|Center/i, 'Facility']
];

export function parseRoomName(nodeId: string) {
  return {
    name: nodeId.replace(/^[A-Z0-9]+_/, '').replace(/_/g, ' '),
    category: CATEGORIES.find(([re]) => re.test(nodeId))?.[1] ?? 'Room'
  };
}
