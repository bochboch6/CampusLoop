import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';

interface CyclingEvent {
  id: string;
  name: string;
  day: string;
  month: string;
  time: string;
  participants: number;
  maxParticipants: number;
  description: string;
}

const EVENTS: CyclingEvent[] = [
  {
    id: '1',
    name: 'Balade du Lac',
    day: '22',
    month: 'MAR',
    time: '08:00',
    participants: 18,
    maxParticipants: 30,
    description: 'Tour panoramique des Berges du Lac, départ depuis la station Lac 1. Niveau débutant bienvenu.',
  },
  {
    id: '2',
    name: 'Circuit Médina',
    day: '29',
    month: 'MAR',
    time: '09:30',
    participants: 11,
    maxParticipants: 20,
    description: 'Découvrez la Médina de Tunis à vélo — ruelles historiques, souks et architecture ottomane.',
  },
  {
    id: '3',
    name: 'Carthage – Sidi Bou Saïd',
    day: '05',
    month: 'AVR',
    time: '07:30',
    participants: 24,
    maxParticipants: 25,
    description: 'Parcours côtier de Carthage jusqu\'au village de Sidi Bou Saïd. Vue imprenable sur le golfe de Tunis.',
  },
  {
    id: '4',
    name: 'Critical Mass Tunis',
    day: '12',
    month: 'AVR',
    time: '17:00',
    participants: 42,
    maxParticipants: 100,
    description: 'Rassemblement mensuel pour la mobilité douce. Peloton festif à travers le centre-ville de Tunis.',
  },
  {
    id: '5',
    name: 'Ariana – El Manar',
    day: '19',
    month: 'AVR',
    time: '08:30',
    participants: 9,
    maxParticipants: 15,
    description: 'Liaison inter-campus depuis Ariana jusqu\'à l\'Université El Manar. Idéal pour les étudiants.',
  },
];

export default function EventsScreen() {
  const [joined, setJoined] = useState<Set<string>>(new Set());

  function handleJoin(event: CyclingEvent) {
    if (joined.has(event.id)) return;
    if (event.participants >= event.maxParticipants) {
      Alert.alert('Complet', 'Cet événement est complet.');
      return;
    }
    setJoined(prev => new Set(prev).add(event.id));
    Alert.alert('Inscription confirmée', `Vous êtes inscrit à "${event.name}".`);
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <Text style={s.title}>Cycling Events</Text>
          <Text style={s.subtitle}>Rejoignez la communauté sur la route</Text>
        </View>

        {EVENTS.map(event => (
          <View key={event.id} style={s.card}>
            <View style={s.cardTop}>
              <View style={s.dateBadge}>
                <Text style={s.dateDay}>{event.day}</Text>
                <Text style={s.dateMonth}>{event.month}</Text>
              </View>

              <View style={s.cardInfo}>
                <Text style={s.eventName}>{event.name}</Text>
                <View style={s.chips}>
                  <View style={s.chip}>
                    <Text style={s.chipText}>⏱ {event.time}</Text>
                  </View>
                  <View style={s.chip}>
                    <Text style={s.chipText}>👥 {event.participants}/{event.maxParticipants}</Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={s.description}>{event.description}</Text>

            <TouchableOpacity
              style={[s.joinBtn, joined.has(event.id) && s.joinBtnDone]}
              onPress={() => handleJoin(event)}
              activeOpacity={0.8}
            >
              <Text style={s.joinBtnText}>
                {joined.has(event.id) ? 'Inscrit ✓' : 'S\'inscrire'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#0d1b2a' },
  scroll:      { flex: 1 },
  container:   { padding: 20, paddingBottom: 40 },

  header:      { marginBottom: 24 },
  title:       { fontSize: 26, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  subtitle:    { fontSize: 14, color: '#8ca0b3' },

  card:        {
    backgroundColor: '#1a2d3d',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  cardTop:     { flexDirection: 'row', gap: 14, marginBottom: 12 },

  dateBadge:   {
    backgroundColor: '#2D6A4F',
    borderRadius: 10,
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dateDay:     { fontSize: 20, fontWeight: '700', color: '#FFFFFF', lineHeight: 24 },
  dateMonth:   { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.5 },

  cardInfo:    { flex: 1, justifyContent: 'center', gap: 6 },
  eventName:   { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  chips:       { flexDirection: 'row', gap: 8 },
  chip:        {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText:    { fontSize: 12, color: '#8ecae6', fontWeight: '500' },

  description: { fontSize: 13, color: '#8ecae6', lineHeight: 19, marginBottom: 4 },

  joinBtn:     {
    backgroundColor: '#2D6A4F',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  joinBtnDone: { backgroundColor: '#1f4d39' },
  joinBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
