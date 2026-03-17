import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp }        from '@/src/context/AppContext';
import { getMinBalance } from '@/src/data/routeMatrix';
import type { Station }  from '@/src/data/stations';
import { C, G, shadow }  from '@/src/constants/theme';

export default function DestinationSelectionScreen() {
  const { originId } = useLocalSearchParams<{ originId: string }>();
  const { state } = useApp();
  const { stations, user }   = state;
  const insets               = useSafeAreaInsets();

  const [loading] = useState(false);

  const originStation = stations.find(s => s.id === originId);
  const candidates    = stations.filter(s => s.id !== originId);

  function slotInfo(station: Station): { text: string; color: string } {
    if (station.emptySlots < 1) return { text: 'Complet',                                                       color: '#EF4444' };
    if (station.emptySlots < 3) return { text: `${station.emptySlots} place${station.emptySlots > 1 ? 's' : ''}`, color: '#F97316' };
    return                             { text: `${station.emptySlots} libres`,                                   color: C.leafGreen };
  }

  function handleSelect(dest: Station) {
    const minBalance = getMinBalance(originId!, dest.id);
    const balance    = user?.balance ?? 0;

    if (dest.emptySlots < 1) {
      Alert.alert('Station complète', `${dest.name} est pleine. Choisissez une autre destination.`);
      return;
    }
    if (balance < 0) {
      Alert.alert('Solde négatif', 'Rechargez votre carte virtuelle avant de partir.');
      return;
    }
    if (balance < minBalance) {
      Alert.alert(
        'Solde insuffisant',
        `Ce trajet nécessite au moins ${minBalance.toFixed(2)} TND.\nVotre solde : ${balance.toFixed(2)} TND\n\nVeuillez recharger depuis votre profil.`,
      );
      return;
    }

    Alert.alert(
      'Confirmer le trajet',
      `Départ : ${originStation?.name ?? originId}\nDestination : ${dest.name}\n\nMontant min. : ${minBalance.toFixed(2)} TND\nVotre solde : ${balance.toFixed(2)} TND\n\nTarif : 0.10 TND/min en cours de trajet.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Prendre le vélo',
          onPress: () => {
            router.push({ pathname: '/qrscan', params: { originId, destinationId: dest.id } });
          },
        },
      ],
    );
  }

  function renderStation({ item }: { item: Station }) {
    const minBalance = getMinBalance(originId!, item.id);
    const balance    = user?.balance ?? 0;
    const canAfford  = balance >= minBalance;
    const hasSlots   = item.emptySlots > 0;
    const available  = canAfford && hasSlots;
    const slot       = slotInfo(item);
    const bikeRatio  = item.capacity > 0 ? item.bikes / item.capacity : 0;

    return (
      <TouchableOpacity
        style={[s.card, shadow.soft, !available && s.cardOff]}
        onPress={() => handleSelect(item)}
        disabled={!available || loading}
        activeOpacity={0.78}
      >
        <View style={[s.availDot, { backgroundColor: available ? C.leafGreen : '#EF4444' }]} />

        <View style={{ flex: 1 }}>
          <Text style={s.stationName}>{item.name}</Text>
          <View style={s.infoRow}>
            <Text style={[s.slotLabel, { color: slot.color }]}>{slot.text}</Text>
            <Text style={s.sep}>·</Text>
            <Text style={s.bikesLabel}>{item.bikes} vélo{item.bikes !== 1 ? 's' : ''}</Text>
          </View>
          <View style={s.miniTrack}>
            <View style={[s.miniFill, {
              width: `${Math.round(bikeRatio * 100)}%` as `${number}%`,
              backgroundColor: bikeRatio >= 0.75 ? C.leafGreen : bikeRatio >= 0.25 ? '#F97316' : '#EF4444',
            }]} />
          </View>
        </View>

        <View style={s.costBlock}>
          <Text style={[s.cost, !canAfford && { color: '#EF4444' }]}>
            {minBalance.toFixed(2)} TND
          </Text>
          <Text style={s.costSub}>minimum</Text>
          {!canAfford && <Text style={s.badgeText}>Solde insuffisant</Text>}
          {canAfford && !hasSlots && <Text style={s.badgeText}>Complet</Text>}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.root}>
      {/* Gradient header */}
      <LinearGradient
        colors={G.forestToMint}
        style={[s.header, { paddingTop: insets.top + 12 }]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View style={s.headerRow}>
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={s.closeBtnText}>×</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Choisir la destination</Text>
            <Text style={s.subtitle}>Départ : {originStation?.name ?? '—'}</Text>
          </View>
        </View>

        <View style={[s.balanceChip, (user?.balance ?? 0) < 0 && s.balanceChipRed]}>
          <Text style={s.balanceText}>
            Solde : {(user?.balance ?? 0).toFixed(2)} TND
            {(user?.balance ?? 0) < 0 ? '  —  Rechargement requis' : ''}
          </Text>
        </View>
      </LinearGradient>

      <FlatList
        data={candidates}
        keyExtractor={item => item.id}
        renderItem={renderStation}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.cream },

  header:        { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  closeBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.22)', justifyContent: 'center', alignItems: 'center' },
  closeBtnText:  { fontSize: 22, color: C.white, fontWeight: '700', lineHeight: 26 },
  title:         { fontSize: 18, fontWeight: '900', color: C.white },
  subtitle:      { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '500' },
  balanceChip:   { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignSelf: 'flex-start' },
  balanceChipRed:{ backgroundColor: 'rgba(220,38,38,0.25)', borderColor: 'rgba(252,165,165,0.5)' },
  balanceText:   { fontSize: 13, fontWeight: '700', color: C.white },

  list:          { padding: 16, paddingBottom: 32 },

  card:          {
    backgroundColor: C.lightCream,
    borderRadius: 22, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: 'rgba(82,183,136,0.15)',
  },
  cardOff:       { opacity: 0.45 },
  availDot:      { width: 10, height: 10, borderRadius: 5, marginTop: 2 },
  stationName:   { fontSize: 15, fontWeight: '800', color: C.darkText, marginBottom: 4 },
  infoRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sep:           { color: C.mutedText, fontSize: 13 },
  slotLabel:     { fontSize: 12, fontWeight: '600' },
  bikesLabel:    { fontSize: 12, color: C.mutedText, fontWeight: '500' },
  miniTrack:     { height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  miniFill:      { height: '100%', borderRadius: 3 },

  costBlock:     { alignItems: 'flex-end', minWidth: 80 },
  cost:          { fontSize: 15, fontWeight: '800', color: C.deepGreen },
  costSub:       { fontSize: 10, color: C.mutedText, fontWeight: '500', marginTop: 1 },
  badgeText:     { fontSize: 10, color: '#EF4444', fontWeight: '700', marginTop: 3 },
});
