import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../data/mockUser';
import type { Station } from '../data/stations';

const KEYS = {
  USER: '@velib_user',
  IS_LOGGED_IN: '@velib_logged_in',
  STATIONS: '@velib_stations',
} as const;

export async function saveUser(user: User): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export async function loadUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(KEYS.USER);
  return raw ? (JSON.parse(raw) as User) : null;
}

export async function setLoggedIn(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.IS_LOGGED_IN, value ? '1' : '0');
}

export async function isLoggedIn(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEYS.IS_LOGGED_IN);
  return v === '1';
}

export async function saveStations(stations: Station[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.STATIONS, JSON.stringify(stations));
}

export async function loadStations(): Promise<Station[] | null> {
  const raw = await AsyncStorage.getItem(KEYS.STATIONS);
  return raw ? (JSON.parse(raw) as Station[]) : null;
}
