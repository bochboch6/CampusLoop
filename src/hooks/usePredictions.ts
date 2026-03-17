import { useState, useEffect, useRef, useCallback } from 'react';

// Expo SDK 49+ expose automatiquement les variables EXPO_PUBLIC_ au runtime
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

const POLL_MS        = 60_000; // rafraîchissement toutes les 60 s
const MAX_RETRIES    = 3;
const RETRY_DELAY_MS = 2_000;  // délai croissant entre tentatives

// ── Types publics ────────────────────────────────────────────────────────────

export interface PredictionHorizon {
  available_slots: number;
  occupancy_pct:   number;
  confidence:      'high' | 'medium' | 'low';
}

export interface PredictionsData {
  station_id:        number;
  station_name:      string;
  current_available: number;
  predictions: {
    '15': PredictionHorizon;
    '30': PredictionHorizon;
    '60': PredictionHorizon;
  };
}

interface HookState {
  data:    PredictionsData | null;
  loading: boolean;
  error:   string | null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function usePredictions(stationId: string | number) {
  const [state, setState] = useState<HookState>({
    data: null, loading: true, error: null,
  });

  const controllerRef = useRef<AbortController | null>(null);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (): Promise<void> => {
    // Annule toute requête précédente
    controllerRef.current?.abort();
    const ctrl = new AbortController();
    controllerRef.current = ctrl;

    setState(prev => ({ ...prev, loading: true, error: null }));

    let lastErr = 'Erreur réseau';

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (ctrl.signal.aborted) return;

      // Délai exponentiel entre tentatives (0 ms, 2 s, 4 s)
      if (attempt > 0) {
        await new Promise<void>(res => setTimeout(res, RETRY_DELAY_MS * attempt));
        if (ctrl.signal.aborted) return;
      }

      try {
        const res = await globalThis.fetch(
          `${BASE_URL}/ml/predictions/${stationId}`,
          { signal: ctrl.signal },
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as PredictionsData;

        if (!ctrl.signal.aborted) {
          setState({ data: json, loading: false, error: null });
        }
        return; // succès

      } catch (e: unknown) {
        if ((e as Error).name === 'AbortError') return; // composant démonté
        lastErr = (e as Error).message ?? 'Erreur réseau';
      }
    }

    // Toutes les tentatives ont échoué
    if (!ctrl.signal.aborted) {
      setState(prev => ({ ...prev, loading: false, error: lastErr }));
    }
  }, [stationId]);

  useEffect(() => {
    void load();

    // Polling automatique
    intervalRef.current = setInterval(() => { void load(); }, POLL_MS);

    // Cleanup : annule requête en cours + arrête polling
    return () => {
      controllerRef.current?.abort();
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [load]); // se réinitialise automatiquement si stationId change

  return { ...state, refresh: load };
}
