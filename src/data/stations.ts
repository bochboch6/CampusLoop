export interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  capacity: number;
  bikes: number;
  emptySlots: number;
}

export const INITIAL_STATIONS: Station[] = [
  {
    id: '1',
    name: 'INSAT',
    latitude: 36.842994412450345,
    longitude: 10.197041658206915,
    capacity: 20,
    bikes: 16,
    emptySlots: 4,
  },
  {
    id: '2',
    name: 'Dorm Jardins (Boys)',
    latitude: 36.8322343777338,
    longitude: 10.181170046850776,
    capacity: 18,
    bikes: 3,
    emptySlots: 15,
  },
  {
    id: '3',
    name: 'Dorm Menzah (Girls)',
    latitude: 36.839979720365555,
    longitude: 10.181495539122494,
    capacity: 24,
    bikes: 18,
    emptySlots: 6,
  },
  {
    id: '4',
    name: 'Dorm Ariana (Boys)',
    latitude: 36.85775814442507,
    longitude: 10.195108470443813,
    capacity: 20,
    bikes: 8,
    emptySlots: 12,
  },
];
