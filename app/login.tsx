import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useApp } from '@/src/context/AppContext';
import { C, G, shadow } from '@/src/constants/theme';

export default function LoginScreen() {
  const { login } = useApp();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  // Screen fade-in
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  // Button scale
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const pressIn  = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 28, bounciness: 8 }).start();

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/map');
    } catch (e: unknown) {
      Alert.alert('Login failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={G.skyToForest} style={StyleSheet.absoluteFillObject} />
      <View style={[s.blob, s.blobTR]} />
      <View style={[s.blob, s.blobBL]} />

      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={s.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View style={[s.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={s.logo}>
              Campus L<Text style={s.logoWheels}>oo</Text>p
            </Text>
            <Text style={s.tagline}>Green mobility in Tunis</Text>
          </Animated.View>

          {/* Divider */}
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <View style={s.dividerDot} />
            <View style={s.dividerLine} />
          </View>

          {/* Form card */}
          <Animated.View style={[s.card, shadow.medium, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={s.title}>Login</Text>
            <Text style={s.subtitle}>Welcome back</Text>

            <Text style={s.label}>Email address</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
              placeholderTextColor={C.mutedText}
            />

            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={C.mutedText}
            />

            <TouchableOpacity
              onPressIn={pressIn} onPressOut={pressOut}
              onPress={handleLogin} disabled={loading} activeOpacity={1}
            >
              <Animated.View style={[s.primaryBtn, shadow.button, { transform: [{ scale: btnScale }] }]}>
                <LinearGradient colors={G.forestToMint} style={s.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading
                    ? <ActivityIndicator color={C.white} />
                    : <Text style={s.primaryBtnText}>Sign in</Text>
                  }
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>

          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={s.link}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex:           { flex: 1 },
  container:      { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 52 },
  blob:           { position: 'absolute', borderRadius: 999, opacity: 0.15, backgroundColor: C.mintGreen },
  blobTR:         { width: 220, height: 220, top: -60, right: -60 },
  blobBL:         { width: 160, height: 160, bottom: 80, left: -50 },
  header:         { alignItems: 'center', marginBottom: 24 },
  logo:           { fontSize: 42, fontWeight: '900', color: C.white, letterSpacing: 0.5 },
  logoWheels:     { color: C.mintGreen },
  tagline:        { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 6, fontWeight: '500', letterSpacing: 0.3 },
  divider:        { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
  dividerLine:    { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  dividerDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  card:           { backgroundColor: C.cream, borderRadius: 28, padding: 28, borderWidth: 1, borderColor: 'rgba(82,183,136,0.15)' },
  title:          { fontSize: 24, fontWeight: '800', color: C.deepGreen, marginBottom: 4 },
  subtitle:       { fontSize: 14, color: C.mutedText, marginBottom: 22 },
  label:          { fontSize: 11, fontWeight: '700', color: C.deepGreen, marginBottom: 7, marginTop: 14, letterSpacing: 0.5, textTransform: 'uppercase' },
  input:          { borderWidth: 1.5, borderColor: C.mintGreen, borderRadius: 16, padding: 14, fontSize: 15, color: C.darkText, backgroundColor: C.lightCream },
  primaryBtn:     { borderRadius: 20, overflow: 'hidden', marginTop: 28 },
  btnGradient:    { paddingVertical: 16, alignItems: 'center', borderRadius: 20 },
  primaryBtnText: { color: C.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  footer:         { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText:     { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
  link:           { color: C.white, fontSize: 14, fontWeight: '800', textDecorationLine: 'underline' },
});
