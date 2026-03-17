import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/src/context/AppContext';

export default function QRScanScreen() {
  const { originId, destinationId } = useLocalSearchParams<{ originId: string; destinationId: string }>();
  const { takeABike } = useApp();
  const insets = useSafeAreaInsets();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  async function onBarcodeScanned({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);

    try {
      const origin = Array.isArray(originId) ? originId[0] : originId;
      const dest = Array.isArray(destinationId) ? destinationId[0] : destinationId;

      await takeABike(origin, dest);

      setTimeout(() => {
        router.replace('/map');
      }, 1500);
    } catch (error) {
      console.error('Error taking bike:', error);
      setScanned(false);
    }
  }

  // Permission not yet determined
  if (!permission) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color="#40916C" size="large" />
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={[s.center, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
        <Text style={s.permTitle}>Camera access required</Text>
        <Text style={s.permDesc}>Camera permission is required to scan the bike</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission} activeOpacity={0.85}>
          <Text style={s.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <Text style={s.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
      />

      {/* Dark overlay with transparent centre */}
      <View style={s.overlay} pointerEvents="none">
        {/* Top dark band + title */}
        <View style={[s.band, { paddingTop: insets.top + 16 }]}>
          <Text style={s.title}>Scan the bike QR code</Text>
          <Text style={s.subtitle}>Point your camera at the QR code on the bike</Text>
        </View>

        {/* Middle row: dark sides + transparent scan frame */}
        <View style={s.middle}>
          <View style={s.side} />
          <View style={s.frame}>
            {/* Green corner marks */}
            <View style={[s.corner, s.cornerTL]} />
            <View style={[s.corner, s.cornerTR]} />
            <View style={[s.corner, s.cornerBL]} />
            <View style={[s.corner, s.cornerBR]} />
          </View>
          <View style={s.side} />
        </View>

        {/* Bottom dark band */}
        <View style={[s.band, s.bandBottom, { paddingBottom: insets.bottom + 24 }]} />
      </View>

      {/* Cancel button — needs touches so outside pointerEvents="none" overlay */}
      {!scanned && (
        <View style={[s.cancelWrap, { bottom: insets.bottom + 32 }]}>
          <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()} activeOpacity={0.75}>
            <Text style={s.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Success overlay */}
      {scanned && (
        <View style={s.successOverlay}>
          <View style={s.successCard}>
            <View style={s.checkCircle}>
              <Text style={s.checkMark}>✓</Text>
            </View>
            <Text style={s.successTitle}>Bike unlocked!</Text>
            <Text style={s.successSub}>Redirecting...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const FRAME = 240;
const CORNER_SIZE = 30;
const CORNER_BORDER = 4;

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#000' },
  center:       { flex: 1, backgroundColor: '#0d1b2a', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  // Permission screen
  permTitle:    { fontSize: 20, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginBottom: 12 },
  permDesc:     { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  permBtn:      { backgroundColor: '#40916C', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 14 },
  permBtnText:  { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },

  // Overlay
  overlay:      { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },
  band:         { backgroundColor: 'rgba(0,0,0,0.62)', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16 },
  bandBottom:   { flex: 1, justifyContent: 'flex-end' },
  title:        { fontSize: 20, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginBottom: 6 },
  subtitle:     { fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 18 },

  middle:       { flexDirection: 'row', height: FRAME },
  side:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)' },
  frame:        { width: FRAME, height: FRAME },

  corner:       { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: '#40916C', borderWidth: CORNER_BORDER },
  cornerTL:     { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR:     { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL:     { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR:     { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },

  // Success overlay
  successOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center', alignItems: 'center',
  },
  successCard:  { alignItems: 'center', gap: 16 },
  checkCircle:  {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#40916C',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  checkMark:    { color: '#FFFFFF', fontSize: 38, fontWeight: '900', lineHeight: 44 },
  successTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  successSub:   { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '500' },

  // Cancel
  cancelWrap:   { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  cancelBtn:    { paddingVertical: 12, paddingHorizontal: 24 },
  cancelBtnText:{ color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: '600' },
});
