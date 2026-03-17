import { router } from 'expo-router';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform, SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import NotificationBanner from '@/src/components/NotificationBanner';
import StationDetailsModal from '@/src/components/StationDetailsModal';
import { C } from '@/src/constants/theme';
import { useApp } from '@/src/context/AppContext';
import type { Station } from '@/src/data/stations';

// ── Custom map style ──────────────────────────────────────────────────────────

const NATURE_MAP_STYLE = [
  { elementType: 'geometry',                      stylers: [{ color: '#0d1b2a' }] },
  { elementType: 'labels.icon',                   stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill',              stylers: [{ color: '#8ecae6' }] },
  { elementType: 'labels.text.stroke',            stylers: [{ color: '#0d1b2a' }] },
  { featureType: 'administrative',                elementType: 'geometry.fill',        stylers: [{ color: '#162536' }] },
  { featureType: 'administrative.country',        elementType: 'labels.text.fill',     stylers: [{ color: '#8ecae6' }] },
  { featureType: 'administrative.locality',       elementType: 'labels.text.fill',     stylers: [{ color: '#a8d8ea' }] },
  { featureType: 'landscape',                     elementType: 'geometry',             stylers: [{ color: '#0d1b2a' }] },
  { featureType: 'poi',                           elementType: 'geometry',             stylers: [{ color: '#112233' }] },
  { featureType: 'poi',                           elementType: 'labels.text.fill',     stylers: [{ color: '#8ecae6' }] },
  { featureType: 'poi.park',                      elementType: 'geometry.fill',        stylers: [{ color: '#1a2f1a' }] },
  { featureType: 'poi.park',                      elementType: 'labels.text.fill',     stylers: [{ color: '#8ecae6' }] },
  { featureType: 'road',                          elementType: 'geometry',             stylers: [{ color: '#1b2838' }] },
  { featureType: 'road',                          elementType: 'geometry.stroke',      stylers: [{ color: '#0d1b2a' }] },
  { featureType: 'road',                          elementType: 'labels.text.fill',     stylers: [{ color: '#8ecae6' }] },
  { featureType: 'road.arterial',                 elementType: 'geometry',             stylers: [{ color: '#1b2838' }] },
  { featureType: 'road.highway',                  elementType: 'geometry',             stylers: [{ color: '#1b2838' }] },
  { featureType: 'road.highway',                  elementType: 'geometry.stroke',      stylers: [{ color: '#0d1b2a' }] },
  { featureType: 'road.highway',                  elementType: 'labels.text.fill',     stylers: [{ color: '#8ecae6' }] },
  { featureType: 'transit',                       elementType: 'geometry',             stylers: [{ color: '#162536' }] },
  { featureType: 'transit.station',               elementType: 'labels.text.fill',     stylers: [{ color: '#8ecae6' }] },
  { featureType: 'water',                         elementType: 'geometry',             stylers: [{ color: '#0a1628' }] },
  { featureType: 'water',                         elementType: 'labels.text.fill',     stylers: [{ color: '#8ecae6' }] },
  { featureType: 'water',                         elementType: 'labels.text.stroke',   stylers: [{ color: '#0a1628' }] },
];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MapScreen() {
  const { state } = useApp();
  const { stations, user, activeRide, notifications } = state;

  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [modalVisible,    setModalVisible]    = useState(false);
  const [notifVisible,    setNotifVisible]    = useState(false);
  const [search,          setSearch]          = useState('');
  const dailyRiders = useRef(68 + Math.floor(Math.random() * 55)).current;

  // Screen fade-in
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().catch(() => {});
  }, []);

  // Redirect to active ride screen when a ride is in progress
  useEffect(() => {
    if (activeRide) {
      router.replace('/activeride');
    }
  }, [!!activeRide]); // eslint-disable-line

  useEffect(() => {
    if (notifications.length > 0) setNotifVisible(true);
  }, [notifications.length]);

  const isInDebt = (user?.balance ?? 0) < 0;

  const filteredStations = useMemo(() => {
    if (!search.trim()) return stations;
    const q = search.trim().toLowerCase();
    return stations.filter(s => s.name.toLowerCase().includes(q));
  }, [stations, search]);

  const totalBikes = useMemo(() => stations.reduce((sum, s) => sum + s.bikes, 0), [stations]);

  return (
    <Animated.View style={[s.container, { opacity: fadeAnim }]}>
      {/* ── Map ──────────────────────────────────────────────────────────── */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        customMapStyle={NATURE_MAP_STYLE}
        initialRegion={{
          latitude: 36.844,
          longitude: 10.189,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {filteredStations.map(station => (
          <Marker
            key={station.id}
            coordinate={{ latitude: station.latitude, longitude: station.longitude }}
            onPress={() => { setSelectedStation(station); setModalVisible(true); }}
            tracksViewChanges={true}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: station.bikes / station.capacity > 0.75 ? '#40916C' : station.bikes / station.capacity > 0.25 ? '#F97316' : '#EF4444',
              borderWidth: 4,
              borderColor: '#FFFFFF',
              elevation: 8,
              zIndex: 99,
            }} />
          </Marker>
        ))}
      </MapView>

      {/* ── Top glass control bar ─────────────────────────────────────────── */}
      <SafeAreaView style={s.topSafe} pointerEvents="box-none">
        <View style={s.topBar}>
          <View style={s.topRow}>
            <TouchableOpacity
              style={s.profileBtn}
              onPress={() => router.navigate('/profile')}
              activeOpacity={0.85}
            >
              <Text style={s.profileInitial}>
                {user?.name ? user.name[0].toUpperCase() : 'C'}
              </Text>
            </TouchableOpacity>

            <View style={s.welcomeBlock}>
              <Text style={s.welcomeName}>
                Bonjour, {user?.name?.split(' ')[0] ?? 'cycliste'}
              </Text>
              <View style={[s.balanceChip, isInDebt && s.balanceChipRed]}>
                <Text style={[s.balanceText, isInDebt && s.balanceTextRed]}>
                  {(user?.balance ?? 0).toFixed(2)} TND{isInDebt ? '  — Solde négatif' : ''}
                </Text>
              </View>
            </View>

            {notifications.length > 0 && (
              <TouchableOpacity
                style={s.notifBtn}
                onPress={() => setNotifVisible(v => !v)}
              >
                <Text style={s.notifCount}>{notifications.length}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Search bar */}
          <View style={s.searchBar}>
            <Text style={s.searchLabel}>Rechercher</Text>
            <TextInput
              style={s.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Station, quartier..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={s.searchClear}>×</Text>
              </TouchableOpacity>
            )}
          </View>
          {search.trim().length > 0 && (
            <Text style={s.searchHint}>
              {filteredStations.length} station{filteredStations.length !== 1 ? 's' : ''} trouvée{filteredStations.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {notifVisible && notifications.length > 0 && (
          <View style={s.notifWrap}>
            <NotificationBanner notifications={notifications} onClose={() => setNotifVisible(false)} />
          </View>
        )}
      </SafeAreaView>

      {/* ── Legend panel ──────────────────────────────────────────────────── */}
      <View style={s.legendPanel}>
        <Text style={s.legendTitle}>VÉLOS</Text>
        <View style={s.legendSep} />
        <LegendRow color={C.leafGreen} label="> 75%" />
        <LegendRow color="#F97316"     label="25–75%" />
        <LegendRow color="#EF4444"     label="< 25%" />
      </View>

      {/* ── Debt warning ──────────────────────────────────────────────────── */}
      {isInDebt && (
        <View style={s.debtBanner}>
          <Text style={s.debtText}>
            Solde négatif ({user!.balance.toFixed(2)} TND) — Rechargez pour continuer.
          </Text>
        </View>
      )}

      {/* ── Bottom info card ──────────────────────────────────────────────── */}
      {!isInDebt && (
        <View style={s.infoCard}>
          <InfoStat label="STATIONS"    value={`${stations.length}`} />
          <View style={s.infoCardSep} />
          <InfoStat label="VÉLOS DISPOS" value={`${totalBikes}`} />
          <View style={s.infoCardSep} />
          <InfoStat label="ACTIFS"      value={`${dailyRiders}`} />
        </View>
      )}

      {/* ── Station details modal ─────────────────────────────────────────── */}
      <StationDetailsModal
        visible={modalVisible}
        station={selectedStation}
        activeRide={activeRide}
        onClose={() => setModalVisible(false)}
        onTakeABike={station => {
          setModalVisible(false);
          router.push({ pathname: '/destination', params: { originId: station.id } });
        }}
      />
    </Animated.View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <View style={s.legendRow}>
      <View style={[s.legendDot, { backgroundColor: color }]} />
      <Text style={s.legendLabel}>{label}</Text>
    </View>
  );
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoStat}>
      <Text style={s.infoStatValue}>{value}</Text>
      <Text style={s.infoStatLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:          { flex: 1 },

  // Top glass bar
  topSafe:            { position: 'absolute', top: 0, left: 0, right: 0 },
  topBar:             {
    backgroundColor: 'rgba(13,26,17,0.94)',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 46 : 10,
    paddingBottom: 14,
    borderWidth: 1, borderTopWidth: 0,
    borderColor: 'rgba(82,183,136,0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 22,
  },
  topRow:             { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },

  profileBtn:         {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: C.leafGreen,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(149,213,178,0.5)',
  },
  profileInitial:     { color: C.white, fontSize: 17, fontWeight: '800' },

  welcomeBlock:       { flex: 1 },
  welcomeName:        { fontSize: 15, fontWeight: '700', color: C.white, marginBottom: 5 },
  balanceChip:        {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(82,183,136,0.2)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(82,183,136,0.35)',
  },
  balanceChipRed:     { backgroundColor: 'rgba(220,38,38,0.2)', borderColor: 'rgba(252,165,165,0.4)' },
  balanceText:        { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  balanceTextRed:     { color: '#FCA5A5' },

  notifBtn:           {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(82,183,136,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(82,183,136,0.4)',
  },
  notifCount:         { color: C.white, fontSize: 14, fontWeight: '800' },

  searchBar:          {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(82,183,136,0.22)',
    gap: 8,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  searchLabel:        { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 },
  searchInput:        { flex: 1, fontSize: 14, color: C.white, fontWeight: '500' },
  searchClear:        { fontSize: 20, color: 'rgba(255,255,255,0.45)', lineHeight: 22 },
  searchHint:         { fontSize: 11, color: 'rgba(149,213,178,0.65)', marginTop: 6, paddingHorizontal: 4, fontWeight: '600' },
  notifWrap:          { paddingHorizontal: 16, paddingTop: 8 },

  // Legend
  legendPanel:        {
    position: 'absolute', bottom: 208, right: 16,
    backgroundColor: 'rgba(13,26,17,0.92)',
    borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: 'rgba(82,183,136,0.25)',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 22, shadowOffset: { width: 0, height: 6 }, elevation: 18,
    minWidth: 96,
  },
  legendTitle:        { fontSize: 9, fontWeight: '800', color: 'rgba(149,213,178,0.65)', letterSpacing: 1.3, marginBottom: 8 },
  legendSep:          { height: 1, backgroundColor: 'rgba(82,183,136,0.2)', marginBottom: 8 },
  legendRow:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  legendDot:          { width: 9, height: 9, borderRadius: 5 },
  legendLabel:        { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  // Debt banner
  debtBanner:         {
    position: 'absolute', bottom: 100, left: 16, right: 16,
    backgroundColor: 'rgba(127,29,29,0.92)',
    borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: 'rgba(252,165,165,0.4)',
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 14, elevation: 12,
  },
  debtText:           { color: '#FCA5A5', fontSize: 13, fontWeight: '700', textAlign: 'center' },

  // Bottom info card
  infoCard:           {
    position: 'absolute', bottom: 28, left: 16, right: 16,
    backgroundColor: 'rgba(13,26,17,0.93)',
    borderRadius: 22, paddingVertical: 14, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(82,183,136,0.28)',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 22, shadowOffset: { width: 0, height: 6 }, elevation: 18,
  },
  infoCardSep:        { width: 1, height: 32, backgroundColor: 'rgba(82,183,136,0.25)' },
  infoStat:           { flex: 1, alignItems: 'center' },
  infoStatValue:      { fontSize: 22, fontWeight: '900', color: C.white, marginBottom: 2 },
  infoStatLabel:      { fontSize: 9, fontWeight: '800', color: 'rgba(149,213,178,0.6)', letterSpacing: 1.1 },
});
