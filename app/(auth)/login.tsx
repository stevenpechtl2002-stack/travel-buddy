import { useAuth } from '@/src/hooks/useAuth'
import { colors, gradients, spacing } from '@/src/constants/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native'

const COUNTRY_CODES = [
  { flag: '🇩🇪', code: '+49', name: 'Deutschland' },
  { flag: '🇦🇹', code: '+43', name: 'Österreich' },
  { flag: '🇨🇭', code: '+41', name: 'Schweiz' },
  { flag: '🇺🇸', code: '+1',  name: 'USA' },
  { flag: '🇬🇧', code: '+44', name: 'UK' },
  { flag: '🇹🇷', code: '+90', name: 'Türkei' },
]

type Tab = 'phone' | 'email'
type PhoneStep = 'number' | 'otp'

export default function LoginScreen() {
  const { sendPhoneOtp, verifyPhoneOtp, signIn } = useAuth()
  const router = useRouter()

  const [tab, setTab] = useState<Tab>('phone')
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('number')
  const [countryIndex, setCountryIndex] = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const [phone, setPhone] = useState('')
  const [fullPhone, setFullPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<(TextInput | null)[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const country = COUNTRY_CODES[countryIndex]

  const handleSendOtp = async () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 6) return Alert.alert('Ungültig', 'Bitte gib deine Telefonnummer ein.')
    const full = country.code + digits
    setFullPhone(full)
    setLoading(true)
    const { error } = await sendPhoneOtp(full)
    setLoading(false)
    if (error) return Alert.alert('Fehler', error.message)
    setPhoneStep('otp')
  }

  const handleOtpChange = (text: string, i: number) => {
    const digit = text.replace(/\D/g, '').slice(-1)
    const next = [...otp]; next[i] = digit; setOtp(next)
    if (digit && i < 5) otpRefs.current[i + 1]?.focus()
    if (!digit && i > 0) otpRefs.current[i - 1]?.focus()
    if (next.every(d => d !== '') && digit) verifyOtp(next.join(''))
  }

  const verifyOtp = async (code: string) => {
    setLoading(true)
    const { error } = await verifyPhoneOtp(fullPhone, code)
    setLoading(false)
    if (error) {
      Alert.alert('Falscher Code', 'Bitte überprüfe den Code.')
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
      return
    }
    router.replace('/(tabs)/discover')
  }

  const handleResend = async () => {
    setLoading(true)
    await sendPhoneOtp(fullPhone)
    setLoading(false)
    setOtp(['', '', '', '', '', ''])
    otpRefs.current[0]?.focus()
    Alert.alert('Gesendet', 'Neuer Code wurde verschickt.')
  }

  const handleEmailLogin = async () => {
    if (!email.trim() || !password) return Alert.alert('Fehler', 'Bitte alle Felder ausfüllen.')
    setLoading(true)
    const { error } = await signIn(email.trim(), password)
    setLoading(false)
    if (error) return Alert.alert('Fehler', error.message)
    router.replace('/(tabs)/discover')
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0d1b2e', '#1a3a5c', '#7e4a35', '#c4703a', '#e8a860']}
        locations={[0, 0.3, 0.55, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Subtle top stars */}
      <View style={[styles.star, { top: 55, left: '12%' }]} />
      <View style={[styles.star, { top: 40, left: '35%', opacity: 0.4 }]} />
      <View style={[styles.star, { top: 68, left: '62%', opacity: 0.5 }]} />
      <View style={[styles.star, { top: 38, left: '80%', opacity: 0.35 }]} />

      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoRow}>
            <LinearGradient colors={gradients.brand} style={styles.logoIcon}>
              <Text style={{ fontSize: 22, color: '#fff' }}>✈</Text>
            </LinearGradient>
            <View>
              <Text style={styles.logoText}>Travel Buddy</Text>
              <Text style={styles.logoSub}>Finde deinen Reisepartner</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.tabs}>
              {(['phone', 'email'] as Tab[]).map(t => (
                <Pressable key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                  onPress={() => { setTab(t); setPhoneStep('number'); setOtp(['', '', '', '', '', '']) }}>
                  <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                    {t === 'phone' ? 'Telefon' : 'E-Mail'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {tab === 'phone' ? (
              phoneStep === 'number' ? (
                <>
                  <Text style={styles.title}>Willkommen zurück</Text>
                  <Text style={styles.sub}>Melde dich mit deiner Telefonnummer an</Text>
                  <Text style={styles.label}>Land</Text>
                  <Pressable style={styles.countryBtn} onPress={() => setShowPicker(v => !v)}>
                    <Text style={styles.countryBtnText}>{country.flag} {country.name} ({country.code})</Text>
                    <Text style={styles.chevron}>{showPicker ? '▲' : '▼'}</Text>
                  </Pressable>
                  {showPicker && (
                    <View style={styles.countryList}>
                      {COUNTRY_CODES.map((c, i) => (
                        <Pressable key={i} style={[styles.countryOption, i === countryIndex && styles.countryOptionActive]}
                          onPress={() => { setCountryIndex(i); setShowPicker(false) }}>
                          <Text style={styles.countryOptionText}>{c.flag} {c.name} {c.code}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  <Text style={styles.label}>Telefonnummer</Text>
                  <View style={styles.phoneRow}>
                    <View style={styles.phonePrefix}><Text style={styles.phonePrefixText}>{country.code}</Text></View>
                    <TextInput style={styles.phoneInput} value={phone} onChangeText={setPhone}
                      placeholder="151 23456789" placeholderTextColor="rgba(26,42,62,0.4)"
                      keyboardType="phone-pad" autoFocus />
                  </View>
                  <Pressable style={styles.mainBtn} onPress={handleSendOtp} disabled={loading}>
                    <LinearGradient colors={gradients.brand} style={styles.mainBtnGrad}>
                      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>Code per SMS senden</Text>}
                    </LinearGradient>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.title}>Code eingeben</Text>
                  <Text style={styles.sub}>Wir haben einen Code an {fullPhone} gesendet</Text>
                  <View style={styles.otpRow}>
                    {otp.map((digit, i) => (
                      <TextInput key={i} ref={r => { otpRefs.current[i] = r }}
                        style={[styles.otpBox, digit && styles.otpBoxFilled]}
                        value={digit} onChangeText={t => handleOtpChange(t, i)}
                        keyboardType="number-pad" maxLength={1} autoFocus={i === 0} selectTextOnFocus />
                    ))}
                  </View>
                  {loading && <ActivityIndicator color={colors.primary} style={{ marginBottom: 12 }} />}
                  <Pressable onPress={handleResend} disabled={loading}>
                    <Text style={styles.resendText}>Code erneut senden</Text>
                  </Pressable>
                  <Pressable onPress={() => { setPhoneStep('number'); setOtp(['', '', '', '', '', '']) }}>
                    <Text style={styles.backText}>‹ Nummer ändern</Text>
                  </Pressable>
                </>
              )
            ) : (
              <>
                <Text style={styles.title}>Mit E-Mail anmelden</Text>
                <Text style={styles.label}>E-Mail</Text>
                <TextInput style={styles.input} value={email} onChangeText={setEmail}
                  placeholder="deine@email.de" placeholderTextColor="rgba(26,42,62,0.4)"
                  keyboardType="email-address" autoCapitalize="none" autoFocus />
                <Text style={styles.label}>Passwort</Text>
                <TextInput style={styles.input} value={password} onChangeText={setPassword}
                  placeholder="••••••••" placeholderTextColor="rgba(26,42,62,0.4)" secureTextEntry />
                <Pressable style={styles.mainBtn} onPress={handleEmailLogin} disabled={loading}>
                  <LinearGradient colors={gradients.brand} style={styles.mainBtnGrad}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>Anmelden</Text>}
                  </LinearGradient>
                </Pressable>
              </>
            )}

            <Pressable style={styles.registerLink} onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLinkText}>
                Noch kein Konto?{' '}
                <Text style={{ color: colors.primary, fontWeight: '800' }}>Registrieren</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, paddingTop: 60 },
  star: {
    position: 'absolute', width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: '#f5f0eb', opacity: 0.6,
  },
  logoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 32, paddingLeft: 4,
  },
  logoIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 24, fontWeight: '900', color: '#f5f0eb' },
  logoSub: { fontSize: 12, color: 'rgba(245,240,235,0.65)', marginTop: 2 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 28, padding: 24,
    shadowColor: '#0d1b2e', shadowOpacity: 0.4, shadowRadius: 30, shadowOffset: { width: 0, height: 10 },
  },
  tabs: {
    flexDirection: 'row', backgroundColor: '#f0ede8', borderRadius: 14, padding: 3, marginBottom: 24,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  tabBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: '700', color: '#999' },
  tabTextActive: { color: '#1a2a3e', fontWeight: '800' },
  title: { fontSize: 20, fontWeight: '900', color: '#1a2a3e', marginBottom: 6 },
  sub: { fontSize: 13, color: '#777', marginBottom: 20, lineHeight: 19 },
  label: {
    fontSize: 11, fontWeight: '800', color: '#1a2a3e', letterSpacing: 0.6,
    marginBottom: 7, marginTop: 4, textTransform: 'uppercase',
  },
  countryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#f4f0eb', borderRadius: 14, padding: 13,
    borderWidth: 1, borderColor: '#e8e0d8', marginBottom: 4,
  },
  countryBtnText: { fontSize: 14, color: '#1a2a3e', fontWeight: '600' },
  chevron: { fontSize: 11, color: '#999' },
  countryList: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e8e0d8',
    marginBottom: 8, overflow: 'hidden',
  },
  countryOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0ede8' },
  countryOptionActive: { backgroundColor: 'rgba(232,132,92,0.08)' },
  countryOptionText: { fontSize: 13, color: '#1a2a3e', fontWeight: '600' },
  phoneRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  phonePrefix: {
    backgroundColor: '#f4f0eb', borderRadius: 14, paddingHorizontal: 13,
    justifyContent: 'center', borderWidth: 1, borderColor: '#e8e0d8',
  },
  phonePrefixText: { fontSize: 15, fontWeight: '700', color: '#1a2a3e' },
  phoneInput: {
    flex: 1, backgroundColor: '#f4f0eb', borderRadius: 14, padding: 13,
    fontSize: 15, color: '#1a2a3e', borderWidth: 1, borderColor: '#e8e0d8',
  },
  input: {
    backgroundColor: '#f4f0eb', borderRadius: 14, padding: 13,
    fontSize: 15, color: '#1a2a3e', borderWidth: 1, borderColor: '#e8e0d8', marginBottom: 14,
  },
  mainBtn: { borderRadius: 50, overflow: 'hidden', marginTop: 6 },
  mainBtnGrad: { padding: 16, alignItems: 'center' },
  mainBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.3 },
  otpRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 20 },
  otpBox: {
    width: 44, height: 54, borderRadius: 14, backgroundColor: '#f4f0eb',
    borderWidth: 2, borderColor: '#e8e0d8', textAlign: 'center',
    fontSize: 22, fontWeight: '900', color: '#1a2a3e',
  },
  otpBoxFilled: { borderColor: colors.primary, backgroundColor: 'rgba(232,132,92,0.06)' },
  resendText: { color: colors.primary, fontWeight: '700', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  backText: { color: '#aaa', fontSize: 13, textAlign: 'center', paddingVertical: 6 },
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerLinkText: { fontSize: 14, color: '#777' },
})
