import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '@/src/context/AppContext';
import { G, shadow } from '@/src/constants/theme';
import type { Station } from '@/src/data/stations';
import { saveTrip } from '@/src/utils/saveTrip';

// ── Helpers ───────────────────────────────────────────────────────────────────

function haversineKm(s1: Station, s2: Station): number {
  const R    = 6371;
  const dLat = ((s2.latitude  - s1.latitude)  * Math.PI) / 180;
  const dLon = ((s2.longitude - s1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((s1.latitude  * Math.PI) / 180) *
    Math.cos((s2.latitude  * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pad(n: number) { return n.toString().padStart(2, '0'); }
function formatSecs(secs: number) { return `${pad(Math.floor(secs / 60))}:${pad(secs % 60)}`; }

interface RideResult { co2Kg: number; scoreGain: number; distKm: number; trees: number; }

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ActiveRideScreen() {
  const { state, returnBike } = useApp();
  const { stations, user, activeRide } = state;

  const [elapsed,    setElapsed]    = useState(0);
  const [detecting,  setDetecting]  = useState(false);
  const [rideResult, setRideResult] = useState<RideResult | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Redirect to map if no active ride (after return)
  useEffect(() => {
    if (!activeRide && !rideResult) {
      router.replace('/map');
    }
  }, [activeRide]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, []);

  // Timer
  useEffect(() => {
    if (!activeRide) return;
    const start = activeRide.startTime;
    setElapsed(Math.floor((Date.now() - start) / 1000));
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [activeRide?.startTime]);

  if (!activeRide) return null;

  const originStation = stations.find(s => s.id === activeRide.originId);
  const destStation   = stations.find(s => s.id === activeRide.destinationId);
  const cost          = (elapsed / 60) * 0.05;
  const balance       = user?.balance ?? 0;

  async function handleArrive() {
    setDetecting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const endTime = new Date();
    const startTime = new Date(activeRide.startTime);
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
    const origin = stations.find(s => s.id === activeRide.originId);
    const dest = stations.find(s => s.id === activeRide.destinationId);

    await saveTrip({
      user_id: user?.email ?? 'unknown',
      user_name: user?.name ?? 'unknown',
      origin_station: origin?.name ?? '',
      destination_station: dest?.name ?? '',
      start_time: startTime,
      end_time: endTime,
      duration_minutes: Math.round(durationMinutes * 100) / 100,
      distance_km: origin && dest ? haversineKm(origin, dest) : 0,
      cost_tnd: Math.round(durationMinutes * 0.05 * 100) / 100,
      bikes_at_origin: origin?.bikes ?? 0,
    });

    returnBike();
    setDetecting(false);
    router.replace('/map');
  }

  function handleChangeStation() {
    router.push({ pathname: '/destination', params: { originId: activeRide.originId } });
  }

  return (
    <Animated.View style={[s.root, { opacity: fadeAnim }]}>
      <SafeAreaView style={s.safe}>

        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <View style={s.topBar}>
          <View style={s.topLeft}>
            <View style={s.greenDot} />
            <Text style={s.topTitle}>Active Ride</Text>
          </View>
          <Text style={s.bikeLabel}>Bike #{activeRide.originId.slice(-4).toUpperCase()}</Text>
        </View>

        {/* ── Card 1: Timer ─────────────────────────────────────────────── */}
        <LinearGradient colors={['#2D6A4F', '#40916C']} style={s.timerCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={s.timerLabel}>ELAPSED TIME</Text>
          <Text style={s.timerValue}>{formatSecs(elapsed)}</Text>
          <Text style={s.costValue}>{cost.toFixed(3)} TND</Text>
          <Text style={s.costRate}>@ 0.05 TND / min</Text>
        </LinearGradient>

        {/* ── Card 2: Route ─────────────────────────────────────────────── */}
        <View style={[s.card, s.routeCard]}>
          <View style={s.routeRow}>
            <Text style={s.routeIcon}>🚲</Text>
            <View>
              <Text style={s.routeRowLabel}>ORIGIN</Text>
              <Text style={s.routeStation}>{originStation?.name ?? activeRide.originId}</Text>
            </View>
          </View>
          <View style={s.routeDivider} />
          <View style={s.routeRow}>
            <Text style={s.routeIcon}>📍</Text>
            <View>
              <Text style={s.routeRowLabel}>DESTINATION</Text>
              <Text style={s.routeStation}>{destStation?.name ?? activeRide.destinationId}</Text>
              {destStation && (
                <Text style={s.slotsText}>{destStation.emptySlots} slot{destStation.emptySlots !== 1 ? 's' : ''} free</Text>
              )}
            </View>
          </View>
        </View>

        {/* ── Card 3: Balance ───────────────────────────────────────────── */}
        <View style={[s.card, s.balanceCard]}>
          <View style={s.balanceRow}>
            <Text style={s.balanceRowLabel}>Remaining Balance</Text>
            <Text style={s.balanceRowValue}>{balance.toFixed(2)} TND</Text>
          </View>
          <View style={s.balanceDivider} />
          <View style={s.balanceRow}>
            <Text style={s.balanceMuted}>Current cost</Text>
            <Text style={s.balanceMuted}>−{cost.toFixed(3)} TND</Text>
          </View>
        </View>

        {/* ── Detecting overlay ─────────────────────────────────────────── */}
        {detecting && (
          <View style={s.detectingOverlay}>
            <View style={s.detectingCard}>
              <ActivityIndicator color="#40916C" size="large" />
              <Text style={s.detectingTitle}>Detecting bike at station...</Text>
              <Text style={s.detectingSubtitle}>Please keep the bike in the slot</Text>
            </View>
          </View>
        )}

        {/* ── Buttons ───────────────────────────────────────────────────── */}
        {!detecting && (
          <View style={s.btnGroup}>
            <TouchableOpacity style={s.outlineBtn} onPress={handleChangeStation} activeOpacity={0.8}>
              <Text style={s.outlineBtnText}>Change Station</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.solidBtn} onPress={handleArrive} activeOpacity={0.85}>
              <Text style={s.solidBtnText}>📍  Arrive at Station</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* ── Ride result modal ──────────────────────────────────────────────── */}
      {rideResult && (
        <Modal visible transparent animationType="fade">
          <View style={s.modalBackdrop}>
            <View style={[s.congrats, shadow.medium]}>
              <LinearGradient colors={G.forestToMint} style={s.congratsHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={s.congratsTitle}>Ride Complete</Text>
                <Text style={s.congratsSub}>Thanks for the planet</Text>
              </LinearGradient>
              <View style={s.congratsBody}>
                <View style={s.statRow}>
                  <View style={s.statCard}>
                    <Text style={s.statValue}>{rideResult.co2Kg.toFixed(2)} kg</Text>
                    <Text style={s.statLabel}>CO₂ saved</Text>
                  </View>
                  <View style={s.statDivider} />
                  <View style={s.statCard}>
                    <Text style={s.statValue}>+{rideResult.scoreGain} pts</Text>
                    <Text style={s.statLabel}>Points earned</Text>
                  </View>
                </View>
                <View style={s.treeBox}>
                  <Text style={s.treeTitle}>
                    {rideResult.trees > 0 ? `${rideResult.trees} tree${rideResult.trees >= 1 ? 's' : ''} planted` : 'Positive impact'}
                  </Text>
                  <Text style={s.treeSub}>{rideResult.distKm.toFixed(1)} km traveled</Text>
                </View>
                <TouchableOpacity
                  style={s.continueBtn}
                  onPress={() => { setRideResult(null); router.replace('/map'); }}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={G.forestToMint} style={s.continueBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={s.continueBtnText}>Continue</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#0d1b2a' },
  safe:             { flex: 1, paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 44 : 0 },

  // Top bar
  topBar:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 20 },
  topLeft:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  greenDot:         { width: 10, height: 10, borderRadius: 5, backgroundColor: '#40916C' },
  topTitle:         { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  bikeLabel:        { fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: '500' },

  // Timer card
  timerCard:        { borderRadius: 24, padding: 28, alignItems: 'center', marginBottom: 16, ...shadow.medium },
  timerLabel:       { fontSize: 10, color: 'rgba(255,255,255,0.65)', letterSpacing: 1.5, fontWeight: '700', marginBottom: 8 },
  timerValue:       { fontSize: 52, fontWeight: '900', color: '#FFFFFF', fontVariant: ['tabular-nums'], letterSpacing: 2, marginBottom: 6 },
  costValue:        { fontSize: 22, fontWeight: '800', color: 'rgba(255,255,255,0.95)', marginBottom: 4 },
  costRate:         { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },

  // Shared card
  card:             {
    backgroundColor: '#112233', borderRadius: 20, padding: 20, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(82,183,136,0.15)',
  },

  // Route card
  routeCard:        {},
  routeRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  routeIcon:        { fontSize: 20, marginTop: 2 },
  routeRowLabel:    { fontSize: 9, color: 'rgba(149,213,178,0.6)', letterSpacing: 1.2, fontWeight: '700', marginBottom: 3 },
  routeStation:     { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  slotsText:        { fontSize: 11, color: '#40916C', fontWeight: '600', marginTop: 3 },
  routeDivider:     { height: 1, backgroundColor: 'rgba(82,183,136,0.18)', marginVertical: 14 },

  // Balance card
  balanceCard:      {},
  balanceRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceRowLabel:  { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  balanceRowValue:  { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  balanceDivider:   { height: 1, backgroundColor: 'rgba(82,183,136,0.15)', marginVertical: 12 },
  balanceMuted:     { fontSize: 12, color: 'rgba(149,213,178,0.5)', fontWeight: '500' },

  // Detecting overlay
  detectingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 99,
  },
  detectingCard:    {
    backgroundColor: '#112233', borderRadius: 24, padding: 32,
    alignItems: 'center', gap: 16, width: 280,
    borderWidth: 1, borderColor: 'rgba(82,183,136,0.3)',
  },
  detectingTitle:   { color: '#FFFFFF', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  detectingSubtitle:{ color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: '400', textAlign: 'center' },

  // Buttons
  btnGroup:         { gap: 12, marginTop: 4 },
  outlineBtn:       {
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)', borderRadius: 16,
    paddingVertical: 15, alignItems: 'center',
  },
  outlineBtnText:   { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  solidBtn:         { backgroundColor: '#40916C', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  solidBtnText:     { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  // Result modal
  modalBackdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  congrats:         { backgroundColor: '#FFFFFF', borderRadius: 28, overflow: 'hidden', width: '100%', maxWidth: 380 },
  congratsHeader:   { padding: 28, alignItems: 'center' },
  congratsTitle:    { fontSize: 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  congratsSub:      { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '500' },
  congratsBody:     { padding: 22 },
  statRow:          { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statCard:         { flex: 1, alignItems: 'center' },
  statDivider:      { width: 1, height: 40, backgroundColor: 'rgba(82,183,136,0.25)' },
  statValue:        { fontSize: 22, fontWeight: '900', color: '#2D6A4F', marginBottom: 3 },
  statLabel:        { fontSize: 11, color: '#6B7280', fontWeight: '600', textAlign: 'center' },
  treeBox:          { backgroundColor: '#F0FAF4', borderRadius: 14, padding: 14, marginBottom: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(82,183,136,0.2)' },
  treeTitle:        { fontSize: 16, fontWeight: '800', color: '#2D6A4F', marginBottom: 3 },
  treeSub:          { fontSize: 12, color: '#6B7280' },
  continueBtn:      { borderRadius: 16, overflow: 'hidden' },
  continueBtnGrad:  { paddingVertical: 15, alignItems: 'center', borderRadius: 16 },
  continueBtnText:  { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
});
