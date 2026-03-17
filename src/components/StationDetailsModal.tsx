import React from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import StationPredictionCard from './StationPredictionCard';
import type { Station } from '../data/stations';
import type { ActiveRide } from '../context/AppContext';
import { C, G, shadow } from '../constants/theme';

interface Props {
  visible:     boolean;
  station:     Station | null;
  activeRide:  ActiveRide | null;
  onClose:     () => void;
  onTakeABike: (station: Station) => void;
}

function AvailBar({ value, max }: { value: number; max: number }) {
  const pct   = max > 0 ? Math.round((value / max) * 100) : 0;
  const color = pct >= 75 ? C.leafGreen : pct >= 25 ? '#F97316' : '#EF4444';
  return (
    <View style={bar.track}>
      <View style={[bar.fill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
    </View>
  );
}
const bar = StyleSheet.create({
  track: { height: 8, flex: 1, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 4 },
});

export default function StationDetailsModal({ visible, station, activeRide, onClose, onTakeABike }: Props) {
  if (!station) return null;

  const canTake = !activeRide && station.bikes > 0;
  const pct     = Math.round((station.bikes / station.capacity) * 100);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[s.sheet, shadow.medium]}>
        <View style={s.handle} />

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* ── Gradient header ──────────────────────────────────────────── */}
          <LinearGradient
            colors={G.forestToMint}
            style={s.gradHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={s.stationName}>{station.name}</Text>
            <Text style={s.stationSub}>Station Campus Loop · Tunis</Text>

            <View style={s.statsRow}>
              <StatCard value={station.bikes}      label="Vélos dispo" />
              <StatCard value={station.emptySlots} label="Places libres" />
              <StatCard value={station.capacity}   label="Capacité" />
            </View>
          </LinearGradient>

          {/* ── Prévisions IA (données réelles via /ml/predictions) ───────
              Inséré directement sous le header, avant la dispo actuelle.
              Le badge "Prédiction IA" et le bouton Actualiser sont intégrés
              dans le composant StationPredictionCard.                      */}
          <StationPredictionCard stationId={station.id} />

          {/* ── Disponibilité actuelle ────────────────────────────────────── */}
          <View style={s.section}>
            <View style={s.rowBetween}>
              <Text style={s.sectionTitle}>Disponibilité actuelle</Text>
              <Text style={[s.pct, { color: pct >= 75 ? C.leafGreen : pct >= 25 ? '#F97316' : '#EF4444' }]}>
                {pct}%
              </Text>
            </View>
            <AvailBar value={station.bikes} max={station.capacity} />
          </View>

          {/* ── Prendre un vélo ───────────────────────────────────────────── */}
          <TouchableOpacity
            style={[s.takeBtn, shadow.button]}
            onPress={() => canTake && onTakeABike(station)}
            disabled={!canTake}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={canTake ? G.forestToMint : ['#CBD5E1', '#CBD5E1']}
              style={s.takeBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={s.takeBtnText}>
                {activeRide
                  ? 'Trajet déjà en cours'
                  : station.bikes < 1
                    ? 'Aucun vélo disponible'
                    : 'Prendre un vélo'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </Modal>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <View style={sc.card}>
      <Text style={sc.value}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  card:  { flex: 1, alignItems: 'center', paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16 },
  value: { fontSize: 26, fontWeight: '900', color: C.white, marginBottom: 2 },
  label: { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: '600', textAlign: 'center', letterSpacing: 0.3 },
});

const s = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:       { backgroundColor: C.cream, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', maxHeight: '82%' },
  handle:      { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 2, alignSelf: 'center', marginTop: 14, position: 'absolute', top: 0, zIndex: 10 },
  gradHeader:  { padding: 24, paddingTop: 30, paddingBottom: 22 },
  stationName: { fontSize: 21, fontWeight: '900', color: C.white, marginBottom: 3, letterSpacing: -0.3 },
  stationSub:  { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 18, fontWeight: '500', letterSpacing: 0.3 },
  statsRow:    { flexDirection: 'row', gap: 10 },
  section:     { marginHorizontal: 20, marginTop: 20, marginBottom: 4 },
  rowBetween:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: C.mutedText, letterSpacing: 0.8, textTransform: 'uppercase' },
  pct:         { fontSize: 14, fontWeight: '800' },
  takeBtn:     { borderRadius: 20, overflow: 'hidden', margin: 20, marginTop: 24 },
  takeBtnGrad: { paddingVertical: 17, alignItems: 'center', borderRadius: 20 },
  takeBtnText: { color: C.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
