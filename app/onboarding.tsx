import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  FlatList, Animated, ListRenderItemInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, G, shadow } from '@/src/constants/theme';

const { width } = Dimensions.get('window');
export const ONBOARDING_KEY = 'campus_loop_onboarding_seen';

// ── Wheel graphic (no emojis) ─────────────────────────────────────────────────

function Wheel({ size = 72, color = 'rgba(255,255,255,0.75)' }: { size?: number; color?: string }) {
  const r = size / 2;
  const spoke = size * 0.65;
  const sw = 1.5;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: r, borderWidth: 3, borderColor: color }} />
      {[0, 45, 90, 135].map(deg => (
        <View key={deg} style={{ position: 'absolute', width: spoke, height: sw, backgroundColor: color, opacity: 0.5, transform: [{ rotate: `${deg}deg` }] }} />
      ))}
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
    </View>
  );
}

// ── Feature icon for slide 2 ──────────────────────────────────────────────────

function FeatureIcon({ letters, bg }: { letters: string; bg: string }) {
  return (
    <View style={[fi.box, { backgroundColor: bg }]}>
      <Text style={fi.letters}>{letters}</Text>
    </View>
  );
}
const fi = StyleSheet.create({
  box:     { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  letters: { color: C.white, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
});

// ── Slides ────────────────────────────────────────────────────────────────────

type SlideId = 'intro' | 'features' | 'cta';

function Slide1() {
  const logoScale  = useRef(new Animated.Value(0)).current;
  const wheelSpin  = useRef(new Animated.Value(0)).current;
  const textFade   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo bounces in
    Animated.spring(logoScale, {
      toValue: 1, tension: 55, friction: 7, useNativeDriver: true,
    }).start(() => {
      // Then gently breathes
      Animated.loop(Animated.sequence([
        Animated.timing(logoScale, { toValue: 1.04, duration: 2200, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1.0,  duration: 2200, useNativeDriver: true }),
      ])).start();
    });
    // Wheels spin
    Animated.loop(Animated.timing(wheelSpin, { toValue: 1, duration: 5000, useNativeDriver: true })).start();
    // Text fades in after logo
    Animated.timing(textFade, { toValue: 1, duration: 600, delay: 500, useNativeDriver: true }).start();
  }, []);

  const spin = wheelSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={sl.slide}>
      {/* Animated logo */}
      <Animated.View style={[sl.logoWrap, { transform: [{ scale: logoScale }] }]}>
        <Text style={sl.logo}>
          Campus L<Text style={sl.logoOo}>OO</Text>P
        </Text>
      </Animated.View>

      {/* Animated wheels */}
      <View style={sl.wheelsRow}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Wheel size={64} />
        </Animated.View>
        <View style={sl.axle} />
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Wheel size={64} />
        </Animated.View>
      </View>

      {/* Tagline */}
      <Animated.View style={{ opacity: textFade }}>
        <Text style={sl.tagline}>Ride Smart.</Text>
        <Text style={sl.tagline}>Save the Planet.</Text>
        <Text style={sl.desc}>
          Green mobility in Tunis — share a bike,{'\n'}reduce your carbon footprint.
        </Text>
      </Animated.View>
    </View>
  );
}

function Slide2() {
  const anims = useRef([0,1,2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(120, anims.map(a => Animated.spring(a, {
      toValue: 1, tension: 70, friction: 8, useNativeDriver: true,
    }))).start();
  }, []);

  const features = [
    { letters: 'MAP',  bg: C.deepGreen,  title: 'Interactive Map',     desc: 'Find a station\nand check availability' },
    { letters: 'TND',  bg: '#2D6A4F',    title: 'Virtual Card',        desc: 'Manage your balance\nand top up in one tap' },
    { letters: 'ECO',  bg: C.leafGreen,  title: 'Eco Score',           desc: 'Track your CO₂ impact\nand climb the leaderboard' },
  ];

  return (
    <View style={sl.slide}>
      <Text style={sl.slideTitle}>Everything you{'\n'}need</Text>
      <Text style={sl.slideDesc}>Three tools for greener, simpler mobility.</Text>
      <View style={sl.featureList}>
        {features.map((f, i) => (
          <Animated.View
            key={f.letters}
            style={[sl.featureCard, {
              opacity: anims[i],
              transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            }]}
          >
            <FeatureIcon letters={f.letters} bg={f.bg} />
            <View style={{ flex: 1 }}>
              <Text style={sl.featureTitle}>{f.title}</Text>
              <Text style={sl.featureDesc}>{f.desc}</Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

function Slide3({ onGetStarted, onLogin }: { onGetStarted: () => void; onLogin: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const onPressIn  = () => Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();

  return (
    <View style={sl.slide}>
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
        {/* Decorative wheel row */}
        <View style={sl.ctaWheels}>
          <Wheel size={50} color="rgba(255,255,255,0.35)" />
          <Wheel size={70} color="rgba(255,255,255,0.6)" />
          <Wheel size={50} color="rgba(255,255,255,0.35)" />
        </View>

        <Text style={sl.ctaTitle}>Ready to{'\n'}ride?</Text>
        <Text style={sl.ctaSub}>
          Join the Campus Loop community and help build a greener city.
        </Text>

        <TouchableOpacity
          onPressIn={onPressIn} onPressOut={onPressOut}
          onPress={onGetStarted} activeOpacity={1}
          style={[sl.ctaBtn, shadow.button]}
        >
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <LinearGradient colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']} style={sl.ctaBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={sl.ctaBtnText}>Create an account</Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity onPress={onLogin} style={sl.loginLink}>
          <Text style={sl.loginLinkText}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ── Onboarding screen ─────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const insets  = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const [current, setCurrent] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  async function finish(dest: '/register' | '/login') {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    router.replace(dest);
  }

  async function skip() {
    await finish('/login');
  }

  function goNext() {
    if (current < 2) {
      const next = current + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrent(next);
    }
  }

  const slides: SlideId[] = ['intro', 'features', 'cta'];

  function renderItem({ item }: ListRenderItemInfo<SlideId>) {
    if (item === 'intro')    return <Slide1 />;
    if (item === 'features') return <Slide2 />;
    return <Slide3 onGetStarted={() => finish('/register')} onLogin={() => finish('/login')} />;
  }

  return (
    <Animated.View style={[s.root, { opacity: fadeAnim }]}>
      <LinearGradient colors={G.skyToForest} style={StyleSheet.absoluteFillObject} />

      {/* Decorative blobs */}
      <View style={[s.blob, s.blobTR]} />
      <View style={[s.blob, s.blobBL]} />

      {/* Skip button */}
      {current < 2 && (
        <TouchableOpacity style={[s.skipBtn, { top: insets.top + 14 }]} onPress={skip}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={item => item}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrent(idx);
        }}
        style={{ flex: 1 }}
      />

      {/* Bottom: dots + next */}
      <View style={[s.bottom, { paddingBottom: insets.bottom + 24 }]}>
        {/* Dot indicators */}
        <View style={s.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[s.dot, i === current && s.dotActive]} />
          ))}
        </View>

        {/* Next button — hidden on last slide (handled inside Slide3) */}
        {current < 2 && (
          <TouchableOpacity style={[s.nextBtn, shadow.button]} onPress={goNext} activeOpacity={0.85}>
            <LinearGradient colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.1)']} style={s.nextBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={s.nextBtnText}>Next</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {current === 2 && <View style={{ height: 50 }} />}
      </View>
    </Animated.View>
  );
}

// ── Slide styles ───────────────────────────────────────────────────────────────

const sl = StyleSheet.create({
  slide:        { width, flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingBottom: 40 },

  // Slide 1
  logoWrap:     { marginBottom: 24, alignItems: 'center' },
  logo:         { fontSize: 40, fontWeight: '900', color: C.white, letterSpacing: 1 },
  logoOo:       { color: C.mintGreen },
  wheelsRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 0 },
  axle:         { width: 36, height: 2.5, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: -2 },
  tagline:      { fontSize: 28, fontWeight: '900', color: C.white, textAlign: 'center', lineHeight: 34, letterSpacing: -0.5 },
  desc:         { fontSize: 14, color: 'rgba(255,255,255,0.78)', textAlign: 'center', marginTop: 14, lineHeight: 22, fontWeight: '400' },

  // Slide 2
  slideTitle:   { fontSize: 30, fontWeight: '900', color: C.white, textAlign: 'center', marginBottom: 10, letterSpacing: -0.5, lineHeight: 36 },
  slideDesc:    { fontSize: 14, color: 'rgba(255,255,255,0.72)', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  featureList:  { gap: 14, width: '100%' },
  featureCard:  {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 22, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  featureTitle: { fontSize: 15, fontWeight: '800', color: C.white, marginBottom: 3 },
  featureDesc:  { fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 18 },

  // Slide 3
  ctaWheels:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 },
  ctaTitle:     { fontSize: 38, fontWeight: '900', color: C.white, textAlign: 'center', lineHeight: 44, letterSpacing: -1, marginBottom: 16 },
  ctaSub:       { fontSize: 15, color: 'rgba(255,255,255,0.78)', textAlign: 'center', lineHeight: 22, marginBottom: 36 },
  ctaBtn:       { borderRadius: 24, overflow: 'hidden', width: '100%', marginBottom: 16 },
  ctaBtnInner:  {
    paddingVertical: 18, alignItems: 'center', borderRadius: 24,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
  },
  ctaBtnText:   { color: C.white, fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  loginLink:    { paddingVertical: 10 },
  loginLinkText:{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});

// ── Screen styles ─────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:     { flex: 1 },
  blob:     { position: 'absolute', borderRadius: 999, opacity: 0.15, backgroundColor: C.mintGreen },
  blobTR:   { width: 240, height: 240, top: -70, right: -70 },
  blobBL:   { width: 180, height: 180, bottom: 60, left: -60 },

  skipBtn:  { position: 'absolute', right: 20, zIndex: 10, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  skipText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },

  bottom:   { paddingHorizontal: 32, paddingTop: 16, alignItems: 'center', gap: 16 },
  dots:     { flexDirection: 'row', gap: 8 },
  dot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive:{ width: 24, backgroundColor: C.white },

  nextBtn:  { borderRadius: 22, overflow: 'hidden', width: '100%' },
  nextBtnInner: {
    paddingVertical: 16, alignItems: 'center', borderRadius: 22,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  nextBtnText:  { color: C.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
