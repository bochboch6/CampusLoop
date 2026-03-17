import type { Station } from '../data/stations';
import type { User } from '../data/mockUser';
import { getPredictions } from './predictions';

export interface AppNotification {
  id: string;
  type: 'info' | 'warning' | 'urgent';
  message: string;
}

function peakHour(hours: number[]): number | null {
  if (!hours.length) return null;
  const freq: Record<number, number> = {};
  hours.forEach(h => { freq[h] = (freq[h] ?? 0) + 1; });
  return parseInt(Object.keys(freq).sort((a, b) => freq[+b] - freq[+a])[0], 10);
}

// Rule-based AI: produces in-app notification messages
export function generateNotifications(stations: Station[], user: User): AppNotification[] {
  const notifications: AppNotification[] = [];
  const currentHour = new Date().getHours();
  const peak = peakHour(user.lastRideHours);

  // 1. Remind user when approaching their typical ride time
  if (peak !== null && Math.abs(currentHour - peak) <= 1) {
    notifications.push({
      id: 'usage-pattern',
      type: 'info',
      message: `Vous roulez habituellement vers ${peak}h00. C'est votre créneau habituel !`,
    });
  }

  // 2. Warn when a station is almost empty or predicted to empty soon
  for (const station of stations) {
    const ratio = station.bikes / station.capacity;
    if (ratio < 0.25 && station.bikes > 0) {
      notifications.push({
        id: `low-${station.id}`,
        type: 'warning',
        message: `${station.name} est presque à court de vélos.`,
      });
    }
    const { p15 } = getPredictions(station);
    if (p15 === 0 && station.bikes > 0) {
      notifications.push({
        id: `empty-soon-${station.id}`,
        type: 'urgent',
        message: `${station.name} sera vide dans 15 min. Dépêchez-vous !`,
      });
    }
  }

  // 3. Encourage usage when score is low
  if (user.totalRides > 0 && user.score < 50) {
    notifications.push({
      id: 'inactivity',
      type: 'info',
      message: "Vous n'avez pas roulé récemment. Chaque trajet contribue à réduire le CO₂ !",
    });
  }

  // Deduplicate and cap at 3
  const seen = new Set<string>();
  return notifications.filter(n => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  }).slice(0, 3);
}
