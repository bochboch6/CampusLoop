import { supabase } from '../lib/supabase';

export async function saveTrip(trip: {
  user_id: string;
  user_name: string;
  origin_station: string;
  destination_station: string;
  start_time: Date;
  end_time: Date;
  duration_minutes: number;
  distance_km: number;
  cost_tnd: number;
  bikes_at_origin: number;
}) {
  const now = new Date();
  const { error } = await supabase.from('trips').insert([{
    ...trip,
    day_of_week: now.getDay(),
    hour_of_day: now.getHours(),
  }]);
  if (error) console.error('Supabase error:', error);
}
