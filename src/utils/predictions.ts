import type { Station } from '../data/stations';

export interface Predictions {
  p15: number;
  p30: number;
  p60: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Simulates demand based on rush-hour patterns
function demandFactor(hour: number): number {
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) return 1.4;
  if (hour >= 10 && hour <= 16) return 0.9;
  return 0.5;
}

// Returns mocked AI predictions for bikes available at +15/+30/+60 minutes
export function getPredictions(station: Station): Predictions {
  const factor = demandFactor(new Date().getHours());
  const delta = Math.round(station.bikes * 0.15 * factor - station.emptySlots * 0.08);

  return {
    p15: clamp(station.bikes - delta,     0, station.capacity),
    p30: clamp(station.bikes - delta * 2, 0, station.capacity),
    p60: clamp(station.bikes - delta * 4, 0, station.capacity),
  };
}
