import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Modal, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/src/context/AppContext';
import RechargeBalanceModal from '@/src/components/RechargeBalanceModal';
import { C, G, shadow } from '@/src/constants/theme';

function getTier(score: number) {
  if (score >= 500) return { label: 'Or',     color: '#F59E0B', next: null,     target: null, progress: 1 };
  if (score >= 200) return { label: 'Argent', color: '#94A3B8', next: 'Or',     target: 500,  progress: (score - 200) / 300 };
  return               { label: 'Bronze', color: '#CD7F32', next: 'Argent', target: 200,  progress: score / 200 };
}

function mostFrequent(arr: number[]): string {
  if (!arr.length) return '?';
  const freq: Record<number, number> = {};
  arr.forEach(h => { freq[h] = (freq[h] ?? 0) + 1; });
  return Object.keys(freq).sort((a, b) => freq[+b] - freq[+a])[0];
}

function SectionDivider() {
  return <View style={div.line} />;
}
const div = StyleSheet.create({
  line: { height: 1, backgroundColor: 'rgba(82,183,136,0.2)', marginVertical: 2 },
});

// ── Virtual bank card ─────────────────────────────────────────────────────────

function VirtualCard({
  balance, name, isInDebt, onRecharge,
}: { balance: number; name: string; isInDebt: boolean; onRecharge: () => void }) {
  // Balance count-up animation
  const countAnim  = useRef(new Animated.Value(0)).current;
  const [displayBal, setDisplayBal] = useState(0);
  const btnScale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const listener = countAnim.addListener(({ value }) => setDisplayBal(value));
    Animated.timing(countAnim, {
      toValue: balance,
      duration: 1100,
      useNativeDriver: false,
    }).start();
    return () => countAnim.removeListener(listener);
  }, [balance]);

  const pressIn  = () => Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 28, bounciness: 8 }).start();

  const gradColors: [string, string, string] = isInDebt
    ? ['#7F1D1D', '#991B1B', '#B91C1C']
    : ['#1B4332', '#2D6A4F', '#40916C'];

  return (
    <View style={vc.wrapper}>
      <LinearGradient colors={gradColors} style={vc.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <LinearGradient
          colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
          style={vc.shine}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          pointerEvents="none"
        />
        <View style={vc.topRow}>
          <View>
            <Text style={vc.brandLine1}>CAMPUS</Text>
            <Text style={vc.brandLine2}>L<Text style={vc.brandOo}>OO</Text>P</Text>
          </View>
          <View style={vc.chip}>
            <View style={vc.chipH} />
            <View style={vc.chipV} />
          </View>
        </View>
        <Text style={vc.balLabel}>SOLDE DISPONIBLE</Text>
        <Text style={vc.balance}>
          {displayBal.toFixed(2)}<Text style={vc.balCurrency}> TND</Text>
        </Text>
        <View style={vc.bottomRow}>
          <Text style={vc.dots}>•••• •••• ••••</Text>
          <Text style={vc.cardHolder}>{name.toUpperCase()}</Text>
        </View>
      </LinearGradient>

      {isInDebt && (
        <View style={vc.debtNotice}>
          <Text style={vc.debtNoticeText}>
            Solde négatif — rechargez pour utiliser le service
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPressIn={pressIn} onPressOut={pressOut}
        onPress={onRecharge} activeOpacity={1}
        style={vc.rechargeBtn}
      >
        <Animated.View style={[{ transform: [{ scale: btnScale }] }, shadow.button]}>
          <LinearGradient
            colors={isInDebt ? [C.errorRed, '#EF4444'] : G.forestToMint}
            style={vc.rechargeBtnGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={vc.rechargeBtnText}>Recharger le solde</Text>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const vc = StyleSheet.create({
  wrapper:        { gap: 12 },
  card:           { borderRadius: 20, padding: 22, height: 190, overflow: 'hidden', position: 'relative' },
  shine:          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 20 },
  topRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  brandLine1:     { color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  brandLine2:     { color: C.white, fontSize: 18, fontWeight: '900', letterSpacing: 3 },
  brandOo:        { color: C.mintGreen },
  chip:           { width: 34, height: 26, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  chipH:          { position: 'absolute', width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.4)' },
  chipV:          { position: 'absolute', width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.4)' },
  balLabel:       { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  balance:        { color: C.white, fontSize: 34, fontWeight: '900', letterSpacing: -0.5 },
  balCurrency:    { fontSize: 16, fontWeight: '700', letterSpacing: 0 },
  bottomRow:      { position: 'absolute', bottom: 20, left: 22, right: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dots:           { color: 'rgba(255,255,255,0.5)', fontSize: 13, letterSpacing: 2 },
  cardHolder:     { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  debtNotice:     { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 10 },
  debtNoticeText: { fontSize: 13, color: C.errorRed, fontWeight: '600', textAlign: 'center' },
  rechargeBtn:    { borderRadius: 18, overflow: 'hidden' },
  rechargeBtnGrad:{ paddingVertical: 15, alignItems: 'center', borderRadius: 18 },
  rechargeBtnText:{ color: C.white, fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { state, logout }         = useApp();
  const { user }                  = state;
  const insets                    = useSafeAreaInsets();
  const [rechargeVisible, setRechargeVisible] = useState(false);
  const [logoutVisible,   setLogoutVisible]   = useState(false);

  // Screen fade-in
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Staggered card animations
  const cardAnims = useRef([0,1,2,3].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Fade screen in
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    // Stagger cards after a short delay
    const timeout = setTimeout(() => {
      Animated.stagger(90, cardAnims.map(a => Animated.spring(a, {
        toValue: 1, tension: 75, friction: 9, useNativeDriver: true,
      }))).start();
    }, 200);
    return () => clearTimeout(timeout);
  }, []);

  if (!user) return null;

  const tier     = getTier(user.score);
  const isInDebt = user.balance < 0;

  async function confirmLogout() {
    setLogoutVisible(false);
    await logout();
    router.replace('/login');
  }

  function AnimatedCard({ index, children, style }: { index: number; children: React.ReactNode; style?: object }) {
    const anim = cardAnims[index];
    return (
      <Animated.View style={[
        s.cardWrap, shadow.soft,
        style,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
        },
      ]}>
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[s.root, { opacity: fadeAnim }]}>
      {/* ── Gradient header ───────────────────────────────────────────────── */}
      <LinearGradient colors={G.forestToSky} style={[s.gradHeader, { paddingTop: insets.top + 10 }]}>
        <View style={s.navRow}>
          <TouchableOpacity style={s.navBtn} onPress={() => router.navigate('/map')} activeOpacity={0.8}>
            <Text style={s.navBtnText}>Carte</Text>
          </TouchableOpacity>
          <Text style={s.navTitle}>Profil</Text>
          <TouchableOpacity style={s.navBtn} onPress={() => setLogoutVisible(true)} activeOpacity={0.8}>
            <Text style={[s.navBtnText, s.navBtnLogout]}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
        <View style={s.avatarBlock}>
          <View style={[s.avatarRing, shadow.medium]}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{user.name?.[0]?.toUpperCase() ?? 'C'}</Text>
            </View>
          </View>
          <Text style={s.userName}>{user.name}</Text>
          <Text style={s.userSub}>{user.email}</Text>
          <Text style={s.userSub}>{user.phone}</Text>
        </View>
      </LinearGradient>

      {/* ── Cards ────────────────────────────────────────────────────────── */}
      <ScrollView style={s.scroll} contentContainerStyle={s.cards} showsVerticalScrollIndicator={false}>

        <AnimatedCard index={0}>
          <Text style={s.sectionTitle}>Carte virtuelle</Text>
          <SectionDivider />
          <View style={{ height: 16 }} />
          <VirtualCard balance={user.balance} name={user.name} isInDebt={isInDebt} onRecharge={() => setRechargeVisible(true)} />
        </AnimatedCard>

        <AnimatedCard index={1}>
          <Text style={s.sectionTitle}>Statut cycliste</Text>
          <SectionDivider />
          <View style={s.tierRow}>
            <View>
              <Text style={[s.tierLabel, { color: tier.color }]}>Niveau {tier.label}</Text>
              <Text style={s.rideCount}>{user.totalRides} trajet{user.totalRides !== 1 ? 's' : ''} effectué{user.totalRides !== 1 ? 's' : ''}</Text>
            </View>
            <Text style={s.scoreVal}>{user.score} pts</Text>
          </View>
          {tier.next && tier.target && (
            <>
              <View style={s.progressTrack}>
                <LinearGradient
                  colors={G.leafToMint}
                  style={[s.progressFill, { width: `${Math.round(tier.progress * 100)}%` as `${number}%` }]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={s.progressLabel}>
                {Math.round(tier.progress * 100)}% vers {tier.next} · {tier.target - user.score} pts restants
              </Text>
            </>
          )}
          {!tier.next && <Text style={s.maxTier}>Niveau maximum atteint</Text>}
        </AnimatedCard>

        <AnimatedCard index={2} style={s.cardGreen}>
          <Text style={[s.sectionTitle, { color: C.deepGreen }]}>Impact environnemental</Text>
          <SectionDivider />
          <View style={s.co2Row}>
            <Text style={s.co2Amount}>{user.co2Saved.toFixed(2)}</Text>
            <Text style={s.co2Unit}> kg CO₂ économisé</Text>
          </View>
          <Text style={s.co2Tree}>
            {Math.max(0, Math.round(user.co2Saved / 21))} arbre{user.co2Saved >= 21 ? 's' : ''} planté{user.co2Saved >= 21 ? 's' : ''}
          </Text>
          <Text style={s.co2Thanks}>Merci pour la planète</Text>
        </AnimatedCard>

        <AnimatedCard index={3}>
          <Text style={s.sectionTitle}>Analyse intelligente</Text>
          <SectionDivider />
          {user.lastRideHours.length > 0 ? (
            <>
              <Text style={s.insightText}>
                Vous roulez généralement vers{' '}
                <Text style={s.insightBold}>{mostFrequent(user.lastRideHours)}h00</Text>
              </Text>
              <Text style={s.insightSub}>
                Campus Loop vous rappellera de vérifier la disponibilité avant votre créneau habituel.
              </Text>
            </>
          ) : (
            <Text style={s.insightText}>
              Effectuez plus de trajets pour débloquer vos analyses personnalisées.
            </Text>
          )}
        </AnimatedCard>
      </ScrollView>

      <RechargeBalanceModal visible={rechargeVisible} onClose={() => setRechargeVisible(false)} />

      {/* ── Logout modal ──────────────────────────────────────────────────── */}
      <Modal visible={logoutVisible} transparent animationType="fade" onRequestClose={() => setLogoutVisible(false)}>
        <View style={lo.backdrop}>
          <Animated.View style={[lo.sheet, shadow.medium, { opacity: fadeAnim }]}>
            <LinearGradient colors={G.forestToSky} style={lo.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={lo.farewell}>Au revoir, {user.name.split(' ')[0]}</Text>
              <Text style={lo.farewellSub}>Résumé de votre session</Text>
            </LinearGradient>
            <View style={lo.body}>
              <View style={lo.sep} />
              <View style={lo.statsRow}>
                <View style={lo.statBox}>
                  <Text style={lo.statVal}>{user.co2Saved.toFixed(2)} kg</Text>
                  <Text style={lo.statLabel}>CO₂ économisé</Text>
                </View>
                <View style={lo.statDivider} />
                <View style={lo.statBox}>
                  <Text style={lo.statVal}>{user.score}</Text>
                  <Text style={lo.statLabel}>Score total</Text>
                </View>
                <View style={lo.statDivider} />
                <View style={lo.statBox}>
                  <Text style={lo.statVal}>{user.totalRides}</Text>
                  <Text style={lo.statLabel}>Trajet{user.totalRides !== 1 ? 's' : ''}</Text>
                </View>
              </View>
              <Text style={lo.thankText}>
                Merci de contribuer à un campus plus vert. À très bientôt !
              </Text>
              <TouchableOpacity style={[lo.confirmBtn, shadow.button]} onPress={confirmLogout} activeOpacity={0.85}>
                <LinearGradient colors={[C.errorRed, '#EF4444']} style={lo.confirmGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={lo.confirmText}>Confirmer la déconnexion</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={lo.stayBtn} onPress={() => setLogoutVisible(false)}>
                <Text style={lo.stayText}>Rester connecté</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.cream },
  gradHeader:     { paddingHorizontal: 20, paddingBottom: 28 },
  navRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  navBtn:         {},
  navBtnText:     { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '700' },
  navBtnLogout:   { color: '#FFB3B3' },
  navTitle:       { fontSize: 17, fontWeight: '800', color: C.white },
  avatarBlock:    { alignItems: 'center' },
  avatarRing:     { borderRadius: 44, borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  avatar:         { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  avatarText:     { color: C.white, fontSize: 34, fontWeight: '800' },
  userName:       { fontSize: 22, fontWeight: '800', color: C.white },
  userSub:        { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  scroll:         { flex: 1 },
  cards:          { padding: 16, gap: 14, paddingBottom: 32 },
  cardWrap:       { backgroundColor: C.lightCream, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(82,183,136,0.15)' },
  cardGreen:      { backgroundColor: '#F0FAF4', borderColor: 'rgba(27,67,50,0.12)' },
  sectionTitle:   { fontSize: 11, fontWeight: '800', color: C.mutedText, letterSpacing: 1.2, marginBottom: 10, textTransform: 'uppercase' },
  tierRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  tierLabel:      { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  scoreVal:       { fontSize: 28, fontWeight: '900', color: C.deepGreen },
  rideCount:      { fontSize: 13, color: C.mutedText },
  progressTrack:  { height: 10, backgroundColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden', marginTop: 14, marginBottom: 6 },
  progressFill:   { height: '100%', borderRadius: 6 },
  progressLabel:  { fontSize: 12, color: C.mutedText },
  maxTier:        { fontSize: 14, color: '#F59E0B', fontWeight: '700', marginTop: 14 },
  co2Row:         { flexDirection: 'row', alignItems: 'baseline', marginTop: 14, marginBottom: 6 },
  co2Amount:      { fontSize: 40, fontWeight: '900', color: C.deepGreen },
  co2Unit:        { fontSize: 15, color: C.deepGreen, fontWeight: '600' },
  co2Tree:        { fontSize: 14, color: C.deepGreen, fontWeight: '700' },
  co2Thanks:      { fontSize: 13, color: C.leafGreen, fontWeight: '500', marginTop: 4 },
  insightText:    { fontSize: 15, color: C.darkText, lineHeight: 22, marginTop: 14 },
  insightBold:    { fontWeight: '800', color: C.deepGreen },
  insightSub:     { fontSize: 13, color: C.mutedText, marginTop: 8, lineHeight: 19 },
});

const lo = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet:        { backgroundColor: C.cream, borderRadius: 28, overflow: 'hidden', width: '100%', maxWidth: 380 },
  header:       { padding: 28, alignItems: 'center' },
  farewell:     { fontSize: 26, fontWeight: '900', color: C.white, textAlign: 'center' },
  farewellSub:  { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 5, fontWeight: '600', letterSpacing: 0.3 },
  body:         { padding: 22 },
  sep:          { height: 1, backgroundColor: 'rgba(82,183,136,0.2)', marginBottom: 20 },
  statsRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#F0FAF4', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(82,183,136,0.2)' },
  statBox:      { flex: 1, alignItems: 'center' },
  statDivider:  { width: 1, height: 36, backgroundColor: 'rgba(82,183,136,0.3)' },
  statVal:      { fontSize: 17, fontWeight: '900', color: C.deepGreen, marginBottom: 3 },
  statLabel:    { fontSize: 10, color: C.mutedText, fontWeight: '600', textAlign: 'center', letterSpacing: 0.3 },
  thankText:    { fontSize: 13, color: C.mutedText, textAlign: 'center', lineHeight: 19, marginBottom: 20 },
  confirmBtn:   { borderRadius: 18, overflow: 'hidden', marginBottom: 12 },
  confirmGrad:  { paddingVertical: 16, alignItems: 'center', borderRadius: 18 },
  confirmText:  { color: C.white, fontSize: 15, fontWeight: '800' },
  stayBtn:      { alignItems: 'center', paddingVertical: 10 },
  stayText:     { color: C.deepGreen, fontSize: 15, fontWeight: '700' },
});
