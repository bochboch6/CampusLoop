export const ROUTE_MATRIX: Record<string, Record<string, number>> = {
  '1': { '2': 2.5, '3': 2.0, '4': 3.0 }, // INSAT
  '2': { '1': 2.5, '3': 1.5, '4': 3.5 }, // Dorm Jardins
  '3': { '1': 2.0, '2': 1.5, '4': 2.5 }, // Dorm Menzah
  '4': { '1': 3.0, '2': 3.5, '3': 2.5 }, // Dorm Ariana
};

export function getMinBalance(originId: string, destinationId: string): number {
  if (originId === destinationId) return 0;
  return ROUTE_MATRIX[originId]?.[destinationId] ?? 1.5;
}
