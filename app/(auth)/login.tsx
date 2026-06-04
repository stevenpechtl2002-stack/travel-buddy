import { useAuth } from '@/src/hooks/useAuth'
import { gradients, colors, spacing } from '@/src/constants/theme'
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

  // Phone flow
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('number')
  const [countryIndex, setCountryIndex] = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const [phone, setPhone] = useState('')
  const [fullPhone, setFullPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<(TextInput | null)[]>([])

  // Email flow
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const country = COUNTRY_CODES[countryIndex]

  /* ── Phone ── */
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

  /* ── Email ── */
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
      <LinearGradient colors={['#3b9de0','#6ab8e8','#a0d4f5','#cce8f8','#e8f6ff']} style={StyleSheet.absoluteFill} />
      <Text style={[styles.cloud,{top:60,left:20}]}>☁️</Text>
      <Text style={[styles.cloud,{top:80,right:30,fontSize:28}]}>☁️</Text>
      <Text style={[styles.cloud,{top:52,left:'38%',fontSize:22,opacity:0.6}]}>☁️</Text>

      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS==='ios'?'padding':'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoRow}>
            <LinearGradient colors={gradients.brand} style={styles.logoIcon}>
              <Text style={{fontSize:22,color:'#fff'}}>✈</Text>
            </LinearGradient>
            <Text style={styles.logoText}>Travel Buddy</Text>
          </View>

          <View style={styles.card}>
            {/* Tabs */}
            <View style={styles.tabs}>
              {(['phone','email'] as Tab[]).map(t => (
                <Pressable key={t} style={[styles.tabBtn, tab===t && styles.tabBtnActive]}
                  onPress={() => { setTab(t); setPhoneStep('number'); setOtp(['','','','','','']) }}>
                  <Text style={[styles.tabText, tab===t && styles.tabTextActive]}>
                    {t==='phone' ? '📱 Telefon' : '✉️ E-Mail'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {tab === 'phone' ? (
              phoneStep === 'number' ? (
                <>
                  <Text style={styles.title}>Mit Telefon anmelden</Text>

                  <Text style={styles.label}>Land</Text>
                  <Pressable style={styles.countryBtn} onPress={() => setShowPicker(v=>!v)}>
                    <Text style={styles.countryBtnText}>{country.flag} {country.name} ({country.code})</Text>
                    <Text style={styles.chevron}>{showPicker?'▲':'▼'}</Text>
                  </Pressable>
                  {showPicker && (
                    <View style={styles.countryList}>
                      {COUNTRY_CODES.map((c,i) => (
                        <Pressable key={i} style={[styles.countryOption, i===countryIndex && styles.countryOptionActive]}
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
                      placeholder="151 23456789" placeholderTextColor="#aaa"
                      keyboardType="phone-pad" autoFocus />
                  </View>

                  <Pressable style={styles.mainBtn} onPress={handleSendOtp} disabled={loading}>
                    <LinearGradient colors={gradients.brand} style={styles.mainBtnGrad}>
                      {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.mainBtnText}>Code per SMS senden ›</Text>}
                    </LinearGradient>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.title}>Code eingeben</Text>
                  <Text style={styles.sub}>Wir haben einen Code an {fullPhone} gesendet</Text>
                  <View style={styles.otpRow}>
                    {otp.map((digit,i) => (
                      <TextInput key={i} ref={r=>{otpRefs.current[i]=r}}
                        style={[styles.otpBox, digit && styles.otpBoxFilled]}
                        value={digit} onChangeText={t=>handleOtpChange(t,i)}
                        keyboardType="number-pad" maxLength={1} autoFocus={i===0} selectTextOnFocus />
                    ))}
                  </View>
                  {loading && <ActivityIndicator color={colors.primary} style={{marginBottom:12}}/>}
                  <Pressable onPress={handleResend} disabled={loading}><Text style={styles.resendText}>Code erneut senden</Text></Pressable>
                  <Pressable onPress={()=>{setPhoneStep('number');setOtp(['','','','','',''])}}><Text style={styles.backText}>‹ Nummer ändern</Text></Pressable>
                </>
              )
            ) : (
              <>
                <Text style={styles.title}>Mit E-Mail anmelden</Text>
                <Text style={styles.label}>E-Mail</Text>
                <TextInput style={styles.input} value={email} onChangeText={setEmail}
                  placeholder="deine@email.de" placeholderTextColor="#aaa"
                  keyboardType="email-address" autoCapitalize="none" autoFocus />
                <Text style={styles.label}>Passwort</Text>
                <TextInput style={styles.input} value={password} onChangeText={setPassword}
                  placeholder="••••••••" placeholderTextColor="#aaa" secureTextEntry />
                <Pressable style={styles.mainBtn} onPress={handleEmailLogin} disabled={loading}>
                  <LinearGradient colors={gradients.brand} style={styles.mainBtnGrad}>
                    {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.mainBtnText}>Anmelden ›</Text>}
                  </LinearGradient>
                </Pressable>
              </>
            )}

            <Pressable style={styles.registerLink} onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLinkText}>Noch kein Konto? <Text style={{color:colors.primary,fontWeight:'800'}}>Registrieren</Text></Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex:1 },
  kav: { flex:1 },
  scroll: { flexGrow:1, justifyContent:'center', padding:spacing.lg },
  cloud: { position:'absolute', fontSize:40, opacity:0.7 },
  logoRow: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, marginBottom:24 },
  logoIcon: { width:46, height:46, borderRadius:14, justifyContent:'center', alignItems:'center' },
  logoText: { fontSize:26, fontWeight:'900', color:'#fff',
    textShadowColor:'rgba(0,0,0,0.2)', textShadowOffset:{width:0,height:1}, textShadowRadius:4 },
  card: { backgroundColor:'rgba(255,255,255,0.93)', borderRadius:28, padding:24,
    shadowColor:'#000', shadowOpacity:0.15, shadowRadius:20, shadowOffset:{width:0,height:8}, elevation:12 },
  tabs: { flexDirection:'row', backgroundColor:'#f0f0f6', borderRadius:16, padding:3, marginBottom:20 },
  tabBtn: { flex:1, paddingVertical:10, borderRadius:13, alignItems:'center' },
  tabBtnActive: { backgroundColor:'#fff', shadowColor:'#000', shadowOpacity:0.08, shadowRadius:4, elevation:2 },
  tabText: { fontSize:14, fontWeight:'700', color:'#888' },
  tabTextActive: { color:'#1a1a2e' },
  title: { fontSize:20, fontWeight:'900', color:'#1a1a2e', marginBottom:16 },
  sub: { fontSize:13, color:'#666', marginBottom:18, lineHeight:19 },
  label: { fontSize:12, fontWeight:'800', color:'#1a1a2e', letterSpacing:0.5, marginBottom:7, marginTop:2 },
  countryBtn: { flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    backgroundColor:'#f4f4f8', borderRadius:14, padding:13, borderWidth:1, borderColor:'#e0e0e8', marginBottom:4 },
  countryBtnText: { fontSize:14, color:'#1a1a2e', fontWeight:'600' },
  chevron: { fontSize:11, color:'#888' },
  countryList: { backgroundColor:'#fff', borderRadius:14, borderWidth:1, borderColor:'#e0e0e8', marginBottom:8, overflow:'hidden' },
  countryOption: { padding:12, borderBottomWidth:1, borderBottomColor:'#f0f0f4' },
  countryOptionActive: { backgroundColor:'rgba(255,140,0,0.1)' },
  countryOptionText: { fontSize:13, color:'#1a1a2e', fontWeight:'600' },
  phoneRow: { flexDirection:'row', gap:8, marginBottom:18 },
  phonePrefix: { backgroundColor:'#f4f4f8', borderRadius:14, paddingHorizontal:13, justifyContent:'center', borderWidth:1, borderColor:'#e0e0e8' },
  phonePrefixText: { fontSize:15, fontWeight:'700', color:'#1a1a2e' },
  phoneInput: { flex:1, backgroundColor:'#f4f4f8', borderRadius:14, padding:13, fontSize:15, color:'#1a1a2e', borderWidth:1, borderColor:'#e0e0e8' },
  input: { backgroundColor:'#f4f4f8', borderRadius:14, padding:13, fontSize:15, color:'#1a1a2e', borderWidth:1, borderColor:'#e0e0e8', marginBottom:14 },
  mainBtn: { borderRadius:50, overflow:'hidden', marginTop:4 },
  mainBtnGrad: { padding:16, alignItems:'center' },
  mainBtnText: { color:'#fff', fontWeight:'900', fontSize:16 },
  otpRow: { flexDirection:'row', gap:8, justifyContent:'center', marginBottom:18 },
  otpBox: { width:44, height:54, borderRadius:14, backgroundColor:'#f4f4f8', borderWidth:2, borderColor:'#e0e0e8', textAlign:'center', fontSize:22, fontWeight:'900', color:'#1a1a2e' },
  otpBoxFilled: { borderColor:colors.primary, backgroundColor:'rgba(255,140,0,0.08)' },
  resendText: { color:colors.primary, fontWeight:'700', fontSize:13, textAlign:'center', paddingVertical:8 },
  backText: { color:'#888', fontSize:13, textAlign:'center', paddingVertical:6 },
  registerLink: { marginTop:18, alignItems:'center' },
  registerLinkText: { fontSize:14, color:'#555' },
})
