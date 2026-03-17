import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, useColorScheme,
} from 'react-native';
import { usePredictions } from '../hooks/usePredictions';
import type { PredictionHorizon } from '../hooks/usePredictions';
import { C, shadow } from '../constants/theme';

// ── Constantes ───────────────────────────────────────────────────────────────

type Horizon = '15' | '30' | '60';
const HORIZONS: Horizon[] = ['15', '30', '60'];

const HORIZON_LABELS: Record<Horizon, string> = {
  '15': '+15 min',
  '30': '+30 min',
  '60': '+60 min',
};

const CONFIDENCE_LABELS: Record<PredictionHorizon['confidence'], string> = {
  high:   'Élevée',
  medium: 'Moyenne',
  low:    'Faible',
};

/** Couleur de la pill selon le nombre de slots disponibles */
function pillColor(slots: number): string {
  if (slots > 5)  return C.leafGreen;
  if (slots >= 2) return '#F97316';
  return '#EF4444';
}

// ── Composant principal ───────────────────────────────────────────────────────

interface Props {
  stationId: string | number;
}

export default function StationPredictionCard({ stationId }: Props) {
  const { data, loading, error, refresh } = usePredictions(stationId);
  const scheme = useColorScheme();
  const dark   = scheme === 'dark';

  // Palette adaptée au mode sombre
  const bg     = dark ? '#182D21' : '#EEF7F2';
  const cardBg = dark ? '#1E3529' : C.white;
  const text   = dark ? C.white   : C.darkText;
  const muted  = dark ? 'rgba(255,255,255,0.5)' : C.mutedText;
  const border = dark ? 'rgba(255,255,255,0.08)' : '#DDE8E3';

  // ── Badge "Prédiction IA" ──────────────────────────────────────────────────
  const AiBadge = (
    <View style={[s.badge, { backgroundColor: C.deepGreen }]}>
      <Text style={s.badgeText}>✦ Prédiction IA</Text>
    </View>
  );

  // ── Loading initial (skeleton) ─────────────────────────────────────────────
  if (loading && !data) {
    return (
      <View style={[s.wrap, { backgroundColor: bg }, shadow.soft]}>
        <View style={s.headerRow}>
          <Text style={[s.title, { color: text }]}>Prévisions en temps réel</Text>
          {AiBadge}
        </View>
        <View style={s.skeletonRow}>
          {HORIZONS.map(h => (
            <View key={h} style={[s.skeletonCard, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={[s.skeletonLine, { backgroundColor: border, width: '60%' }]} />
              <View style={[s.skeletonPill, { backgroundColor: border }]} />
              <View style={[s.skeletonLine, { backgroundColor: border, width: '40%' }]} />
            </View>
          ))}
        </View>
        <ActivityIndicator color={C.leafGreen} style={{ marginTop: 8 }} />
      </View>
    );
  }

  // ── Erreur réseau (sans données en cache) ─────────────────────────────────
  if (error && !data) {
    return (
      <View style={[s.wrap, { backgroundColor: bg }, shadow.soft]}>
        <View style={s.headerRow}>
          <Text style={[s.title, { color: text }]}>Prévisions en temps réel</Text>
          {AiBadge}
        </View>
        <Text style={[s.errorMsg, { color: C.errorRed }]}>
          Connexion impossible — {error}
        </Text>
        <TouchableOpacity
          style={[s.outlineBtn, { borderColor: C.leafGreen }]}
          onPress={refresh}
          activeOpacity={0.8}
        >
          <Text style={[s.outlineBtnText, { color: C.leafGreen }]}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data) return null;

  return (
    <View style={[s.wrap, { backgroundColor: bg }, shadow.soft]}>

      {/* ── En-tête ───────────────────────────────────────────────────────── */}
      <View style={[s.headerRow, { marginBottom: 14 }]}>
        <View>
          <Text style={[s.title, { color: text }]}>Prévisions en temps réel</Text>
          <Text style={[s.subtitle, { color: muted }]}>Slots disponibles estimés</Text>
        </View>
        <View style={s.headerRight}>
          {AiBadge}
          {/* Indicateur de refresh en arrière-plan */}
          <TouchableOpacity
            style={s.iconBtn}
            onPress={refresh}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {loading
              ? <ActivityIndicator size="small" color={C.leafGreen} />
              : <Text style={[s.refreshIcon, { color: C.leafGreen }]}>↻</Text>
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Disponibilité actuelle ────────────────────────────────────────── */}
      <View style={[s.currentBox, { backgroundColor: cardBg, borderColor: border }]}>
        <Text style={[s.currentLabel, { color: muted }]}>Maintenant</Text>
        <Text style={[s.currentValue, { color: C.leafGreen }]}>
          {data.current_available}
        </Text>
        <Text style={[s.currentUnit, { color: muted }]}>slots dispo</Text>
      </View>

      {/* ── Pills horizon +15 / +30 / +60 ────────────────────────────────── */}
      <View style={s.pillsRow}>
        {HORIZONS.map((h) => {
          const pred  = data.predictions[h];
          const color = pillColor(pred.available_slots);
          return (
            <View key={h} style={[s.pillCard, { backgroundColor: cardBg, borderColor: border }]}>

              {/* Label horizon */}
              <Text style={[s.horizonLbl, { color: muted }]}>
                {HORIZON_LABELS[h]}
              </Text>

              {/* Pill colorée : vert > 5, orange 2-5, rouge < 2 */}
              <View style={[s.pill, { backgroundColor: color }]}>
                <Text style={s.pillNum}>{pred.available_slots}</Text>
                <Text style={s.pillUnit}>slots</Text>
              </View>

              {/* Taux d'occupation */}
              <Text style={[s.occPct, { color: muted }]}>
                {pred.occupancy_pct.toFixed(0)}% occ.
              </Text>

              {/* Niveau de confiance */}
              <Text style={[s.confText, { color: muted }]}>
                {CONFIDENCE_LABELS[pred.confidence]}
              </Text>

            </View>
          );
        })}
      </View>

      {/* ── Bouton "Actualiser" manuel ────────────────────────────────────── */}
      <TouchableOpacity
        style={[s.outlineBtn, { borderColor: C.leafGreen, opacity: loading ? 0.6 : 1 }]}
        onPress={refresh}
        activeOpacity={0.8}
        disabled={loading}
      >
        <Text style={[s.outlineBtnText, { color: C.leafGreen }]}>
          {loading ? 'Actualisation…' : '↻  Actualiser'}
        </Text>
      </TouchableOpacity>

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  wrap:        { borderRadius: 20, marginHorizontal: 20, marginTop: 16, padding: 18 },
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title:       { fontSize: 13, fontWeight: '800', letterSpacing: 0.4 },
  subtitle:    { fontSize: 11, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  badge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText:   { fontSize: 9, fontWeight: '800', color: C.white, letterSpacing: 0.6, textTransform: 'uppercase' },

  iconBtn:     { padding: 4 },
  refreshIcon: { fontSize: 18, fontWeight: '700' },

  // ── Slot courant
  currentBox:   {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1,
  },
  currentLabel: { fontSize: 12, fontWeight: '600' },
  currentValue: { fontSize: 34, fontWeight: '900', lineHeight: 40 },
  currentUnit:  { fontSize: 12, fontWeight: '600' },

  // ── Pills
  pillsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  pillCard: { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center', gap: 5, borderWidth: 1 },
  horizonLbl: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  pill:       { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 22, alignItems: 'center' },
  pillNum:    { fontSize: 20, fontWeight: '900', color: C.white, lineHeight: 24 },
  pillUnit:   { fontSize: 8,  fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.4 },
  occPct:     { fontSize: 11, fontWeight: '700' },
  confText:   { fontSize: 9, textAlign: 'center' },

  // ── Bouton outline
  outlineBtn:     { borderRadius: 12, borderWidth: 1.5, paddingVertical: 12, alignItems: 'center' },
  outlineBtnText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },

  // ── Error
  errorMsg: { fontSize: 13, marginVertical: 12, textAlign: 'center' },

  // ── Skeleton loader
  skeletonRow:  { flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 8 },
  skeletonCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 8, borderWidth: 1 },
  skeletonLine: { height: 8,  borderRadius: 4 },
  skeletonPill: { width: 44,  height: 44, borderRadius: 22 },
});
