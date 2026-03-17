export interface User {
  name: string;
  phone: string;
  email: string;
  password: string;
  balance: number;
  score: number;
  co2Saved: number;
  totalRides: number;
  lastRideHours: number[];
}

export const DEMO_USER: User = {
  name: 'Ahmed Ben Ali',
  phone: '+216 71 234 567',
  email: 'ahmed.benali@example.com',
  password: 'demo1234',
  balance: 15.0,
  score: 340,
  co2Saved: 4.8,
  totalRides: 17,
  lastRideHours: [8, 8, 17, 18, 9, 17, 8],
};
