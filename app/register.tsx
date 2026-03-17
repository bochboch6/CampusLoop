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

type FormKey = 'name' | 'phone' | 'email' | 'password';
interface FormState { name: string; phone: string; email: string; password: string }

const FIELDS: { key: FormKey; label: string; placeholder: string; keyboard: 'default' | 'phone-pad' | 'email-address'; secure: boolean }[] = [
  { key: 'name',     label: 'Full name',               placeholder: 'Ahmed Ben Ali',    keyboard: 'default',       secure: false },
  { key: 'phone',    label: 'Phone number',            placeholder: '+216 71 234 567',  keyboard: 'phone-pad',     secure: false },
  { key: 'email',    label: 'Email address',           placeholder: 'you@example.com',  keyboard: 'email-address', secure: false },
  { key: 'password', label: 'Password',                placeholder: '••••••••',         keyboard: 'default',       secure: true  },
];

export default function RegisterScreen() {
  const { register } = useApp();
  const [form,    setForm]    = useState<FormState>({ name: '', phone: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const btnScale  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const pressIn  = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 28, bounciness: 8 }).start();

  const set = (field: FormKey, value: string) => setForm(p => ({ ...p, [field]: value }));

  function validate(): string | null {
    if (!form.name.trim())                        return 'Full name is required.';
    if (!/^\+?[\d\s\-]{7,15}$/.test(form.phone)) return 'Invalid phone number.';
    if (!/\S+@\S+\.\S+/.test(form.email))         return 'Invalid email address.';
    if (form.password.length < 6)                 return 'Password must be at least 6 characters.';
    return null;
  }

  async function handleRegister() {
    const err = validate();
    if (err) { Alert.alert('Validation', err); return; }
    setLoading(true);
    try {
      await register(form.name.trim(), form.phone.trim(), form.email.trim().toLowerCase(), form.password);
      router.replace('/map');
    } catch (e: unknown) {
      Alert.alert('Registration failed', e instanceof Error ? e.message : 'Unknown error');
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
          <Animated.View style={[s.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={s.logo}>
              Campus L<Text style={s.logoWheels}>oo</Text>p
            </Text>
            <Text style={s.tagline}>Create your cyclist account</Text>
          </Animated.View>

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <View style={s.dividerDot} />
            <View style={s.dividerLine} />
          </View>

          <View style={s.bonusChip}>
            <Text style={s.bonusText}>10 TND bonus on sign-up</Text>
          </View>

          <Animated.View style={[s.card, shadow.medium, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={s.title}>Create account</Text>

            {FIELDS.map(f => (
              <View key={f.key}>
                <Text style={s.label}>{f.label}</Text>
                <TextInput
                  style={s.input}
                  value={form[f.key]}
                  onChangeText={v => set(f.key, v)}
                  keyboardType={f.keyboard}
                  autoCapitalize={f.key === 'name' ? 'words' : 'none'}
                  secureTextEntry={f.secure}
                  placeholder={f.placeholder}
                  placeholderTextColor={C.mutedText}
                />
              </View>
            ))}

            <TouchableOpacity
              onPressIn={pressIn} onPressOut={pressOut}
              onPress={handleRegister} disabled={loading} activeOpacity={1}
            >
              <Animated.View style={[s.primaryBtn, shadow.button, { transform: [{ scale: btnScale }] }]}>
                <LinearGradient colors={G.forestToMint} style={s.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading
                    ? <ActivityIndicator color={C.white} />
                    : <Text style={s.primaryBtnText}>Create my account</Text>
                  }
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>

          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={s.link}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex:           { flex: 1 },
  container:      { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 40 },
  blob:           { position: 'absolute', borderRadius: 999, opacity: 0.15, backgroundColor: C.mintGreen },
  blobTR:         { width: 200, height: 200, top: -50, right: -50 },
  blobBL:         { width: 140, height: 140, bottom: 60, left: -40 },
  header:         { alignItems: 'center', marginBottom: 20 },
  logo:           { fontSize: 40, fontWeight: '900', color: C.white, letterSpacing: 0.5 },
  logoWheels:     { color: C.mintGreen },
  tagline:        { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 6, fontWeight: '500', letterSpacing: 0.3 },
  divider:        { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  dividerLine:    { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  dividerDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  bonusChip:      { alignSelf: 'center', marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  bonusText:      { color: C.white, fontSize: 13, fontWeight: '700' },
  card:           { backgroundColor: C.cream, borderRadius: 28, padding: 24, borderWidth: 1, borderColor: 'rgba(82,183,136,0.15)' },
  title:          { fontSize: 22, fontWeight: '800', color: C.deepGreen, marginBottom: 16 },
  label:          { fontSize: 11, fontWeight: '700', color: C.deepGreen, marginBottom: 7, marginTop: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  input:          { borderWidth: 1.5, borderColor: C.mintGreen, borderRadius: 16, padding: 13, fontSize: 15, color: C.darkText, backgroundColor: C.lightCream },
  primaryBtn:     { borderRadius: 20, overflow: 'hidden', marginTop: 24 },
  btnGradient:    { paddingVertical: 16, alignItems: 'center', borderRadius: 20 },
  primaryBtnText: { color: C.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  footer:         { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText:     { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
  link:           { color: C.white, fontSize: 14, fontWeight: '800', textDecorationLine: 'underline' },
});
