import React, {
  createContext, useContext, useReducer, useEffect, useRef,
} from 'react';
import { INITIAL_STATIONS, type Station } from '../data/stations';
import { DEMO_USER, type User } from '../data/mockUser';
import { getMinBalance } from '../data/routeMatrix';
import {
  saveUser, loadUser, setLoggedIn, isLoggedIn, saveStations, loadStations,
} from '../utils/storage';
import { generateNotifications, type AppNotification } from '../utils/aiSimulation';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ActiveRide {
  originId: string;
  destinationId: string;
  startTime: number;
}

interface AppState {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: User | null;
  stations: Station[];
  activeRide: ActiveRide | null;
  notifications: AppNotification[];
}

type AppAction =
  | { type: 'HYDRATE'; payload: Partial<AppState> }
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'UPDATE_STATIONS'; payload: Station[] }
  | { type: 'SET_ACTIVE_RIDE'; payload: ActiveRide | null }
  | { type: 'SET_NOTIFICATIONS'; payload: AppNotification[] }
  | { type: 'DRAIN_BALANCE' };

interface AppContextValue {
  state: AppState;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, phone: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  takeABike: (originId: string, destinationId: string) => void;
  returnBike: () => void;
  rechargeBalance: (amount: number) => Promise<void>;
}

// ── Reducer ───────────────────────────────────────────────────────────────────

const initialState: AppState = {
  isLoggedIn: false,
  isLoading: true,
  user: null,
  stations: INITIAL_STATIONS,
  activeRide: null,
  notifications: [],
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload, isLoading: false };
    case 'LOGIN':
      return { ...state, isLoggedIn: true, user: action.payload };
    case 'LOGOUT':
      return { ...state, isLoggedIn: false, user: null, activeRide: null };
    case 'UPDATE_USER':
      return { ...state, user: state.user ? { ...state.user, ...action.payload } : state.user };
    case 'UPDATE_STATIONS':
      return { ...state, stations: action.payload };
    case 'SET_ACTIVE_RIDE':
      return { ...state, activeRide: action.payload };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'DRAIN_BALANCE': {
      if (!state.user) return state;
      return {
        ...state,
        user: { ...state.user, balance: Math.round((state.user.balance - 0.01) * 100) / 100 },
      };
    }
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hydrate from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      const loggedIn  = await isLoggedIn();
      const user      = await loadUser();
      const stations  = await loadStations();
      dispatch({
        type: 'HYDRATE',
        payload: {
          isLoggedIn: loggedIn,
          user: loggedIn && user ? user : null,
          stations: stations ?? INITIAL_STATIONS,
        },
      });
    })();
  }, []);

  // Refresh AI notifications when stations or user changes
  useEffect(() => {
    if (state.user && state.stations.length) {
      dispatch({
        type: 'SET_NOTIFICATIONS',
        payload: generateNotifications(state.stations, state.user),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.stations, state.user?.totalRides]);

  // Balance drain at 0.10 TND/min (0.01 TND every 6 s) while riding
  useEffect(() => {
    if (state.activeRide) {
      intervalRef.current = setInterval(() => dispatch({ type: 'DRAIN_BALANCE' }), 6000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [!!state.activeRide]); // eslint-disable-line

  // Persist user whenever it changes
  useEffect(() => {
    if (state.isLoggedIn && state.user) saveUser(state.user);
  }, [state.user]); // eslint-disable-line

  // ── Auth ──────────────────────────────────────────────────────────────────

  async function login(email: string, password: string) {
    const user = await loadUser();
    if (!user) throw new Error('No account found. Please register first.');
    if (user.email !== email || user.password !== password)
      throw new Error('Incorrect email or password.');
    await setLoggedIn(true);
    dispatch({ type: 'LOGIN', payload: user });
  }

  async function register(name: string, phone: string, email: string, password: string) {
    const newUser: User = {
      ...DEMO_USER, name, phone, email, password,
      balance: 10.0 /* TND */, score: 0, co2Saved: 0, totalRides: 0, lastRideHours: [],
    };
    await saveUser(newUser);
    await setLoggedIn(true);
    dispatch({ type: 'LOGIN', payload: newUser });
  }

  async function logout() {
    await setLoggedIn(false);
    dispatch({ type: 'LOGOUT' });
  }

  // ── Ride actions ──────────────────────────────────────────────────────────

  function takeABike(originId: string, destinationId: string) {
    const origin     = state.stations.find(s => s.id === originId);
    const dest       = state.stations.find(s => s.id === destinationId);
    const minBalance = getMinBalance(originId, destinationId);

    if (!origin || origin.bikes < 1) throw new Error('No bikes available at this station.');
    if (!dest || dest.emptySlots < 1) throw new Error('Destination station has no empty slots.');
    if ((state.user?.balance ?? 0) < 0) throw new Error('Negative balance — please recharge.');
    if ((state.user?.balance ?? 0) < minBalance)
      throw new Error(`Solde insuffisant. Minimum requis : ${minBalance.toFixed(2)} TND.`);

    const updated = state.stations.map(s =>
      s.id === originId ? { ...s, bikes: s.bikes - 1, emptySlots: s.emptySlots + 1 } : s,
    );
    dispatch({ type: 'UPDATE_STATIONS', payload: updated });
    dispatch({ type: 'SET_ACTIVE_RIDE', payload: { originId, destinationId, startTime: Date.now() } });
    saveStations(updated);
  }

  function returnBike() {
    if (!state.activeRide) return;
    const { originId, destinationId, startTime } = state.activeRide;
    const distKm    = haversine(originId, destinationId);
    const co2Gain   = Math.round(distKm * 0.12 * 100) / 100;
    const scoreGain = 10 + Math.round(distKm * 5);

    const updatedStations = state.stations.map(s =>
      s.id === destinationId
        ? { ...s, bikes: Math.min(s.bikes + 1, s.capacity), emptySlots: Math.max(s.emptySlots - 1, 0) }
        : s,
    );
    const updatedUser: User = {
      ...state.user!,
      co2Saved:     Math.round((state.user!.co2Saved + co2Gain) * 100) / 100,
      score:        state.user!.score + scoreGain,
      totalRides:   state.user!.totalRides + 1,
      lastRideHours: [...state.user!.lastRideHours, new Date(startTime).getHours()].slice(-10),
    };

    dispatch({ type: 'UPDATE_STATIONS', payload: updatedStations });
    dispatch({ type: 'UPDATE_USER',     payload: updatedUser });
    dispatch({ type: 'SET_ACTIVE_RIDE', payload: null });
    saveStations(updatedStations);
    saveUser(updatedUser);
  }

  async function rechargeBalance(amount: number) {
    const updated: User = {
      ...state.user!,
      balance: Math.round((state.user!.balance + amount) * 100) / 100,
    };
    dispatch({ type: 'UPDATE_USER', payload: updated });
    await saveUser(updated);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function haversine(id1: string, id2: string): number {
    const s1 = state.stations.find(s => s.id === id1);
    const s2 = state.stations.find(s => s.id === id2);
    if (!s1 || !s2) return 1;
    const R    = 6371;
    const dLat = ((s2.latitude  - s1.latitude)  * Math.PI) / 180;
    const dLon = ((s2.longitude - s1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((s1.latitude * Math.PI) / 180) *
      Math.cos((s2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  return (
    <AppContext.Provider value={{ state, login, register, logout, takeABike, returnBike, rechargeBalance }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
