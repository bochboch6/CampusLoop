import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';

const AMOUNTS = [5, 10, 20, 50];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function RechargeBalanceModal({ visible, onClose }: Props) {
  const { state, rechargeBalance } = useApp();

  const [step,       setStep]       = useState(1);
  const [amount,     setAmount]     = useState(10);
  const [method,     setMethod]     = useState<'card' | 'd17' | null>(null);

  const [cardNumber, setCardNumber] = useState('');
  const [cardName,   setCardName]   = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV,    setCardCVV]    = useState('');
  const [d17Phone,   setD17Phone]   = useState('');
  const [d17Pin,     setD17Pin]     = useState('');

  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);

  const balance = state.user?.balance ?? 0;

  function reset() {
    setStep(1); setAmount(10); setMethod(null);
    setCardNumber(''); setCardName(''); setCardExpiry(''); setCardCVV('');
    setD17Phone(''); setD17Pin('');
    setError(''); setLoading(false);
  }

  function handleClose() { reset(); onClose(); }

  function formatCard(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})(?=.)/g, '$1 ');
  }

  function formatExpiry(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  }

  function validate(): boolean {
    if (method === 'card') {
      if (cardNumber.replace(/\s/g, '').length !== 16) { setError('Card number must be 16 digits.'); return false; }
      if (!cardName.trim())                             { setError('Cardholder name is required.'); return false; }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry))          { setError('Expiry must be MM/YY.'); return false; }
      if (!/^\d{3,4}$/.test(cardCVV))                  { setError('CVV must be 3 or 4 digits.'); return false; }
    } else {
      if (!d17Phone.startsWith('+216'))                 { setError('Phone must start with +216.'); return false; }
      if (!/^\d{4}$/.test(d17Pin))                     { setError('PIN must be exactly 4 digits.'); return false; }
    }
    setError('');
    return true;
  }

  async function handleConfirm() {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    try {
      await rechargeBalance(amount);
      handleClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred.');
      setLoading(false);
    }
  }

  // ── Step 1: Amount ────────────────────────────────────────────────────────────

  function Step1() {
    return (
      <>
        <Text style={s.stepTitle}>Recharge Balance</Text>
        <View style={s.balanceBox}>
          <Text style={s.balanceLabel}>Current balance</Text>
          <Text style={s.balanceAmt}>{balance.toFixed(2)} TND</Text>
        </View>

        <Text style={s.sectionLabel}>Choose amount</Text>
        <View style={s.amountGrid}>
          {AMOUNTS.map(a => (
            <TouchableOpacity
              key={a}
              style={[s.amountBtn, amount === a && s.amountBtnActive]}
              onPress={() => setAmount(a)}
              activeOpacity={0.8}
            >
              <Text style={[s.amountVal, amount === a && s.amountValActive]}>{a}</Text>
              <Text style={[s.amountCur, amount === a && s.amountCurActive]}>TND</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.summaryRow}>
          <Text style={s.summaryText}>New balance after top-up:</Text>
          <Text style={s.summaryAmt}>{(balance + amount).toFixed(2)} TND</Text>
        </View>

        <TouchableOpacity style={s.primaryBtn} onPress={() => setStep(2)} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>Next →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.ghostBtn} onPress={handleClose} activeOpacity={0.7}>
          <Text style={s.ghostBtnText}>Cancel</Text>
        </TouchableOpacity>
      </>
    );
  }

  // ── Step 2: Payment method ────────────────────────────────────────────────────

  function Step2() {
    return (
      <>
        <Text style={s.stepTitle}>Payment Method</Text>
        <Text style={s.stepSub}>How would you like to pay?</Text>

        <View style={s.methodRow}>
          <TouchableOpacity
            style={[s.methodCard, method === 'card' && s.methodCardActive]}
            onPress={() => setMethod('card')}
            activeOpacity={0.8}
          >
            <Text style={s.methodEmoji}>💳</Text>
            <Text style={[s.methodName, method === 'card' && s.methodNameActive]}>Bank Card</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.methodCard, method === 'd17' && s.methodCardActive]}
            onPress={() => setMethod('d17')}
            activeOpacity={0.8}
          >
            <Text style={s.methodEmoji}>📱</Text>
            <Text style={[s.methodName, method === 'd17' && s.methodNameActive]}>D17 Wallet</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[s.primaryBtn, !method && s.primaryBtnDisabled]}
          onPress={() => { if (method) { setError(''); setStep(3); } }}
          activeOpacity={0.85}
          disabled={!method}
        >
          <Text style={s.primaryBtnText}>Next →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.ghostBtn} onPress={() => setStep(1)} activeOpacity={0.7}>
          <Text style={s.ghostBtnText}>← Back</Text>
        </TouchableOpacity>
      </>
    );
  }

  // ── Step 3: Payment details ───────────────────────────────────────────────────

  function Step3() {
    return (
      <>
        <Text style={s.stepTitle}>{method === 'card' ? 'Card Details' : 'D17 Details'}</Text>
        <Text style={s.stepSub}>Amount: <Text style={{ fontWeight: '800', color: '#2D6A4F' }}>{amount} TND</Text></Text>

        {method === 'card' ? (
          <>
            <Text style={s.fieldLabel}>Card Number</Text>
            <TextInput
              style={s.input}
              value={cardNumber}
              onChangeText={t => setCardNumber(formatCard(t))}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor="#aaa"
              keyboardType="number-pad"
              maxLength={19}
            />
            <Text style={s.fieldLabel}>Cardholder Name</Text>
            <TextInput
              style={s.input}
              value={cardName}
              onChangeText={setCardName}
              placeholder="Ahmed Ben Ali"
              placeholderTextColor="#aaa"
              autoCapitalize="words"
            />
            <View style={s.rowInputs}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Expiry</Text>
                <TextInput
                  style={s.input}
                  value={cardExpiry}
                  onChangeText={t => setCardExpiry(formatExpiry(t))}
                  placeholder="MM/YY"
                  placeholderTextColor="#aaa"
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>CVV</Text>
                <TextInput
                  style={s.input}
                  value={cardCVV}
                  onChangeText={setCardCVV}
                  placeholder="•••"
                  placeholderTextColor="#aaa"
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                />
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={s.fieldLabel}>Phone Number</Text>
            <TextInput
              style={s.input}
              value={d17Phone}
              onChangeText={setD17Phone}
              placeholder="+216 XX XXX XXX"
              placeholderTextColor="#aaa"
              keyboardType="phone-pad"
            />
            <Text style={s.fieldLabel}>D17 PIN</Text>
            <TextInput
              style={s.input}
              value={d17Pin}
              onChangeText={setD17Pin}
              placeholder="••••"
              placeholderTextColor="#aaa"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
            />
          </>
        )}

        {!!error && <Text style={s.errorText}>{error}</Text>}

        {loading ? (
          <View style={s.processingBox}>
            <ActivityIndicator color="#2D6A4F" size="small" />
            <Text style={s.processingText}>Processing...</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity style={s.primaryBtn} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>Confirm Recharge</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ghostBtn} onPress={() => { setError(''); setStep(2); }} activeOpacity={0.7}>
              <Text style={s.ghostBtnText}>← Back</Text>
            </TouchableOpacity>
          </>
        )}
      </>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={handleClose} />
      <View style={s.sheet}>
        {/* Step dots */}
        <View style={s.dotsRow}>
          {[1, 2, 3].map(n => (
            <View key={n} style={[s.dot, step === n && s.dotActive, step > n && s.dotDone]} />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={s.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop:           { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:              {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 12, maxHeight: '90%',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 20,
  },
  dotsRow:            { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: 16 },
  dot:                { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  dotActive:          { width: 24, backgroundColor: '#40916C' },
  dotDone:            { backgroundColor: '#2D6A4F' },

  body:               { padding: 24, paddingTop: 4, paddingBottom: 32 },

  stepTitle:          { fontSize: 22, fontWeight: '900', color: '#2D6A4F', marginBottom: 6 },
  stepSub:            { fontSize: 13, color: '#6B7280', marginBottom: 20 },

  // Step 1
  balanceBox:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0FAF4', borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#D1FAE5' },
  balanceLabel:       { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  balanceAmt:         { fontSize: 22, fontWeight: '900', color: '#2D6A4F' },
  sectionLabel:       { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },
  amountGrid:         { flexDirection: 'row', gap: 10, marginBottom: 20 },
  amountBtn:          { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  amountBtnActive:    { borderColor: '#40916C', backgroundColor: '#F0FAF4' },
  amountVal:          { fontSize: 18, fontWeight: '800', color: '#9CA3AF' },
  amountValActive:    { color: '#2D6A4F' },
  amountCur:          { fontSize: 9, color: '#9CA3AF', fontWeight: '600', letterSpacing: 0.5, marginTop: 1 },
  amountCurActive:    { color: '#40916C' },
  summaryRow:         { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F0FAF4', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#D1FAE5' },
  summaryText:        { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  summaryAmt:         { fontSize: 15, fontWeight: '900', color: '#2D6A4F' },

  // Step 2
  methodRow:          { flexDirection: 'row', gap: 12, marginBottom: 24 },
  methodCard:         { flex: 1, alignItems: 'center', paddingVertical: 24, borderRadius: 16, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  methodCardActive:   { borderColor: '#40916C', backgroundColor: '#F0FAF4' },
  methodEmoji:        { fontSize: 30, marginBottom: 8 },
  methodName:         { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  methodNameActive:   { color: '#2D6A4F' },

  // Step 3
  fieldLabel:         { fontSize: 11, fontWeight: '700', color: '#374151', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 14, marginBottom: 6 },
  input:              { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827', backgroundColor: '#FAFAFA' },
  rowInputs:          { flexDirection: 'row' },
  errorText:          { color: '#EF4444', fontSize: 13, fontWeight: '600', marginTop: 12, textAlign: 'center' },
  processingBox:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 20 },
  processingText:     { fontSize: 15, color: '#2D6A4F', fontWeight: '600' },

  // Buttons
  primaryBtn:         { backgroundColor: '#2D6A4F', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryBtnDisabled: { backgroundColor: '#9CA3AF' },
  primaryBtnText:     { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  ghostBtn:           { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  ghostBtnText:       { color: '#6B7280', fontSize: 14, fontWeight: '600' },
});
