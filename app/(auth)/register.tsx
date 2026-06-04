import { useAuth } from '@/src/hooks/useAuth'
import { useMyProfile } from '@/src/hooks/useMyProfile'
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

const TRAVEL_STYLES = ['🏕️ Backpacker','🏙️ City','🏖️ Beach','⛰️ Adventure','🥂 Luxury']
const INTERESTS = ['🏄 Surfen','📸 Fotografie','🍜 Street Food','🤿 Tauchen','🧘 Yoga','🎵 Musik','🥾 Wandern','🎨 Kunst','🍷 Wein','🚴 Fahrrad']

type Method = 'phone' | 'email'
type Step = 'method' | 'otp' | 'basics' | 'details' | 'interests'

export default function RegisterScreen() {
  const { sendPhoneOtp, verifyPhoneOtp, signUp, session } = useAuth()
  const userId = session?.user.id ?? ''
  const { save } = useMyProfile(userId)
  const router = useRouter()

  const [step, setStep] = useState<Step>('method')
  const [method, setMethod] = useState<Method>('phone')
  const [loading, setLoading] = useState(false)

  // Phone
  const [countryIndex, setCountryIndex] = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const [phone, setPhone] = useState('')
  const [fullPhone, setFullPhone] = useState('')
  const [otp, setOtp] = useState(['','','','','',''])
  const otpRefs = useRef<(TextInput|null)[]>([])

  // Email
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Profile
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [country, setCountry] = useState('')
  const [bio, setBio] = useState('')
  const [travelStyle, setTravelStyle] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  const COUNTRY = COUNTRY_CODES[countryIndex]
  const totalSteps = 4
  const stepIndex = { method:1, otp:2, basics:3, details:4, interests:4 }[step] ?? 1

  const goToApp = () => router.replace('/(tabs)/discover')

  /* ── Method step ── */
  const handleMethodNext = async () => {
    if (method === 'phone') {
      const digits = phone.replace(/\D/g, '')
      if (digits.length < 6) return Alert.alert('Ungültig', 'Bitte gib deine Telefonnummer ein.')
      const full = COUNTRY.code + digits
      setFullPhone(full)
      setLoading(true)
      const { error } = await sendPhoneOtp(full)
      setLoading(false)
      if (error) return Alert.alert('Fehler', error.message)
      setStep('otp')
    } else {
      if (!email.trim()) return Alert.alert('Fehler', 'Bitte E-Mail eingeben.')
      if (password.length < 6) return Alert.alert('Fehler', 'Passwort mindestens 6 Zeichen.')
      if (password !== confirmPassword) return Alert.alert('Fehler', 'Passwörter stimmen nicht überein.')
      setLoading(true)
      const { error } = await signUp(email.trim(), password)
      setLoading(false)
      if (error) return Alert.alert('Fehler', error.message)
      setStep('basics')
    }
  }

  /* ── OTP step ── */
  const handleOtpChange = (text: string, i: number) => {
    const digit = text.replace(/\D/g,'').slice(-1)
    const next = [...otp]; next[i] = digit; setOtp(next)
    if (digit && i < 5) otpRefs.current[i+1]?.focus()
    if (!digit && i > 0) otpRefs.current[i-1]?.focus()
    if (next.every(d=>d!=='') && digit) verifyOtp(next.join(''))
  }

  const verifyOtp = async (code: string) => {
    setLoading(true)
    const { error } = await verifyPhoneOtp(fullPhone, code)
    setLoading(false)
    if (error) {
      Alert.alert('Falscher Code','Bitte überprüfe den Code.')
      setOtp(['','','','','','']); otpRefs.current[0]?.focus()
      return
    }
    setStep('basics')
  }

  /* ── Save profile ── */
  const saveAndContinue = async (nextStep: Step | 'done') => {
    if (userId) {
      await save({
        name: name || 'Traveler',
        tagline: '✈ Solo Traveler',
        bio,
        travelStyle: travelStyle.replace(/^.*?\s/, '') || 'Adventure',
        destinations: [],
        interests: selectedInterests,
        images: [],
      })
    }
    if (nextStep === 'done') goToApp()
    else setStep(nextStep)
  }

  const STEPS = [
    { key:'method', label:'Konto' },
    { key:'otp',    label:'Verifizierung' },
    { key:'basics', label:'Basics' },
    { key:'details',label:'Profil' },
  ]

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#3b9de0','#6ab8e8','#a0d4f5','#cce8f8','#e8f6ff']} style={StyleSheet.absoluteFill}/>
      <Text style={[styles.cloud,{top:55,left:18}]}>☁️</Text>
      <Text style={[styles.cloud,{top:75,right:25,fontSize:26}]}>☁️</Text>

      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS==='ios'?'padding':'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoRow}>
            <LinearGradient colors={gradients.brand} style={styles.logoIcon}>
              <Text style={{fontSize:22,color:'#fff'}}>✈</Text>
            </LinearGradient>
            <Text style={styles.logoText}>Travel Buddy</Text>
          </View>

          {/* Progress */}
          <View style={styles.progressRow}>
            {STEPS.map((s,i) => (
              <View key={s.key} style={styles.progressItem}>
                <View style={[styles.progressDot, stepIndex > i+1 && styles.progressDotDone,
                  stepIndex === i+1 && styles.progressDotActive]}>
                  <Text style={styles.progressDotText}>{stepIndex > i+1 ? '✓' : i+1}</Text>
                </View>
                <Text style={styles.progressLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>

            {/* ── STEP 1: Method ── */}
            {(step === 'method') && (
              <>
                <Text style={styles.title}>Konto erstellen</Text>

                {/* Toggle */}
                <View style={styles.tabs}>
                  {(['phone','email'] as Method[]).map(m => (
                    <Pressable key={m} style={[styles.tabBtn, method===m && styles.tabBtnActive]}
                      onPress={() => setMethod(m)}>
                      <Text style={[styles.tabText, method===m && styles.tabTextActive]}>
                        {m==='phone'?'📱 Telefon':'✉️ E-Mail'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {method === 'phone' ? (
                  <>
                    <Text style={styles.label}>Land</Text>
                    <Pressable style={styles.countryBtn} onPress={()=>setShowPicker(v=>!v)}>
                      <Text style={styles.countryBtnText}>{COUNTRY.flag} {COUNTRY.name} ({COUNTRY.code})</Text>
                      <Text style={styles.chevron}>{showPicker?'▲':'▼'}</Text>
                    </Pressable>
                    {showPicker && (
                      <View style={styles.countryList}>
                        {COUNTRY_CODES.map((c,i) => (
                          <Pressable key={i} style={[styles.countryOption, i===countryIndex && styles.countryOptionActive]}
                            onPress={()=>{setCountryIndex(i);setShowPicker(false)}}>
                            <Text style={styles.countryOptionText}>{c.flag} {c.name} {c.code}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                    <Text style={styles.label}>Telefonnummer</Text>
                    <View style={styles.phoneRow}>
                      <View style={styles.phonePrefix}><Text style={styles.phonePrefixText}>{COUNTRY.code}</Text></View>
                      <TextInput style={styles.phoneInput} value={phone} onChangeText={setPhone}
                        placeholder="151 23456789" placeholderTextColor="#aaa" keyboardType="phone-pad"/>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>E-Mail</Text>
                    <TextInput style={styles.input} value={email} onChangeText={setEmail}
                      placeholder="deine@email.de" placeholderTextColor="#aaa"
                      keyboardType="email-address" autoCapitalize="none"/>
                    <Text style={styles.label}>Passwort</Text>
                    <TextInput style={styles.input} value={password} onChangeText={setPassword}
                      placeholder="Mindestens 6 Zeichen" placeholderTextColor="#aaa" secureTextEntry/>
                    <Text style={styles.label}>Passwort bestätigen</Text>
                    <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword}
                      placeholder="••••••••" placeholderTextColor="#aaa" secureTextEntry/>
                  </>
                )}

                <Pressable style={styles.mainBtn} onPress={handleMethodNext} disabled={loading}>
                  <LinearGradient colors={gradients.brand} style={styles.mainBtnGrad}>
                    {loading?<ActivityIndicator color="#fff"/>:<Text style={styles.mainBtnText}>Weiter ›</Text>}
                  </LinearGradient>
                </Pressable>

                <Pressable style={styles.loginLink} onPress={() => router.back()}>
                  <Text style={styles.loginLinkText}>Bereits ein Konto? <Text style={{color:colors.primary,fontWeight:'800'}}>Anmelden</Text></Text>
                </Pressable>
              </>
            )}

            {/* ── STEP 2: OTP ── */}
            {step === 'otp' && (
              <>
                <Text style={styles.title}>Code bestätigen</Text>
                <Text style={styles.sub}>Wir haben einen 6-stelligen Code an{'\n'}{fullPhone} gesendet</Text>
                <View style={styles.otpRow}>
                  {otp.map((digit,i) => (
                    <TextInput key={i} ref={r=>{otpRefs.current[i]=r}}
                      style={[styles.otpBox, digit && styles.otpBoxFilled]}
                      value={digit} onChangeText={t=>handleOtpChange(t,i)}
                      keyboardType="number-pad" maxLength={1} autoFocus={i===0} selectTextOnFocus/>
                  ))}
                </View>
                {loading && <ActivityIndicator color={colors.primary} style={{marginBottom:12}}/>}
                <Pressable onPress={async()=>{setLoading(true);await sendPhoneOtp(fullPhone);setLoading(false);setOtp(['','','','','','']);otpRefs.current[0]?.focus()}}>
                  <Text style={styles.resendText}>Code erneut senden</Text>
                </Pressable>
                <Pressable onPress={()=>setStep('method')}><Text style={styles.backText}>‹ Zurück</Text></Pressable>
              </>
            )}

            {/* ── STEP 3: Basics ── */}
            {step === 'basics' && (
              <>
                <View style={styles.stepHeader}>
                  <Text style={styles.title}>Über dich</Text>
                  <Pressable onPress={goToApp}><Text style={styles.skipText}>Überspringen</Text></Pressable>
                </View>
                <Text style={styles.sub}>Diese Infos sehen andere Reisende auf deiner Karte</Text>

                <Text style={styles.label}>Dein Name</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName}
                  placeholder="z.B. Anna" placeholderTextColor="#aaa" autoFocus/>

                <Text style={styles.label}>Alter</Text>
                <TextInput style={styles.input} value={age} onChangeText={setAge}
                  placeholder="z.B. 26" placeholderTextColor="#aaa" keyboardType="number-pad"/>

                <Text style={styles.label}>Herkunftsland</Text>
                <TextInput style={styles.input} value={country} onChangeText={setCountry}
                  placeholder="z.B. Deutschland" placeholderTextColor="#aaa"/>

                <Pressable style={styles.mainBtn} onPress={() => setStep('details')} disabled={loading}>
                  <LinearGradient colors={gradients.brand} style={styles.mainBtnGrad}>
                    <Text style={styles.mainBtnText}>Weiter ›</Text>
                  </LinearGradient>
                </Pressable>
              </>
            )}

            {/* ── STEP 4: Details ── */}
            {step === 'details' && (
              <>
                <View style={styles.stepHeader}>
                  <Text style={styles.title}>Dein Stil</Text>
                  <Pressable onPress={() => saveAndContinue('done')}><Text style={styles.skipText}>Überspringen</Text></Pressable>
                </View>

                <Text style={styles.label}>Bio</Text>
                <TextInput style={[styles.input,styles.inputMulti]} value={bio} onChangeText={setBio}
                  placeholder="Erzähl etwas über dich…" placeholderTextColor="#aaa"
                  multiline numberOfLines={3}/>

                <Text style={styles.label}>Reisestil</Text>
                <View style={styles.chips}>
                  {TRAVEL_STYLES.map(s => (
                    <Pressable key={s} onPress={() => setTravelStyle(s)}>
                      {travelStyle === s
                        ? <LinearGradient colors={gradients.brandH} style={styles.chipActive}>
                            <Text style={styles.chipActiveText}>{s}</Text>
                          </LinearGradient>
                        : <View style={styles.chip}><Text style={styles.chipText}>{s}</Text></View>
                      }
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.label,{marginTop:16}]}>Interessen</Text>
                <View style={styles.chips}>
                  {INTERESTS.map(i => {
                    const active = selectedInterests.includes(i)
                    return (
                      <Pressable key={i} onPress={() => setSelectedInterests(p => active ? p.filter(x=>x!==i) : [...p,i])}>
                        {active
                          ? <LinearGradient colors={gradients.brandH} style={styles.chipActive}>
                              <Text style={styles.chipActiveText}>{i}</Text>
                            </LinearGradient>
                          : <View style={styles.chip}><Text style={styles.chipText}>{i}</Text></View>
                        }
                      </Pressable>
                    )
                  })}
                </View>

                <Pressable style={[styles.mainBtn,{marginTop:20}]} onPress={()=>saveAndContinue('done')} disabled={loading}>
                  <LinearGradient colors={gradients.brand} style={styles.mainBtnGrad}>
                    {loading?<ActivityIndicator color="#fff"/>:<Text style={styles.mainBtnText}>Fertig & App starten ›</Text>}
                  </LinearGradient>
                </Pressable>
              </>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex:1 },
  kav: { flex:1 },
  scroll: { flexGrow:1, padding:spacing.lg, paddingTop:60 },
  cloud: { position:'absolute', fontSize:40, opacity:0.7 },
  logoRow: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, marginBottom:16 },
  logoIcon: { width:42,height:42,borderRadius:13,justifyContent:'center',alignItems:'center' },
  logoText: { fontSize:24,fontWeight:'900',color:'#fff',
    textShadowColor:'rgba(0,0,0,0.2)',textShadowOffset:{width:0,height:1},textShadowRadius:4 },
  progressRow: { flexDirection:'row', justifyContent:'center', gap:4, marginBottom:16 },
  progressItem: { alignItems:'center', gap:4 },
  progressDot: { width:28,height:28,borderRadius:14,backgroundColor:'rgba(255,255,255,0.25)',
    justifyContent:'center',alignItems:'center',borderWidth:2,borderColor:'rgba(255,255,255,0.8)' },
  progressDotActive: { backgroundColor:colors.primary,borderColor:colors.primary },
  progressDotDone: { backgroundColor:'#4ade80',borderColor:'#4ade80' },
  progressDotText: { color:'#fff',fontSize:11,fontWeight:'900' },
  progressLabel: { fontSize:9,color:'#fff',fontWeight:'700',
    textShadowColor:'rgba(0,0,0,0.4)',textShadowOffset:{width:0,height:1},textShadowRadius:2 },
  card: { backgroundColor:'rgba(255,255,255,0.93)',borderRadius:28,padding:24,
    shadowColor:'#000',shadowOpacity:0.15,shadowRadius:20,shadowOffset:{width:0,height:8},elevation:12,
    marginBottom:20 },
  stepHeader: { flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:6 },
  skipText: { color:colors.primary,fontWeight:'700',fontSize:14 },
  title: { fontSize:20,fontWeight:'900',color:'#1a1a2e',marginBottom:4 },
  sub: { fontSize:13,color:'#666',marginBottom:18,lineHeight:19 },
  label: { fontSize:12,fontWeight:'800',color:'#1a1a2e',letterSpacing:0.5,marginBottom:7,marginTop:2 },
  tabs: { flexDirection:'row',backgroundColor:'#f0f0f6',borderRadius:16,padding:3,marginBottom:18 },
  tabBtn: { flex:1,paddingVertical:9,borderRadius:13,alignItems:'center' },
  tabBtnActive: { backgroundColor:'#fff',shadowColor:'#000',shadowOpacity:0.08,shadowRadius:4,elevation:2 },
  tabText: { fontSize:13,fontWeight:'700',color:'#888' },
  tabTextActive: { color:'#1a1a2e' },
  countryBtn: { flexDirection:'row',alignItems:'center',justifyContent:'space-between',
    backgroundColor:'#f4f4f8',borderRadius:14,padding:12,borderWidth:1,borderColor:'#e0e0e8',marginBottom:4 },
  countryBtnText: { fontSize:14,color:'#1a1a2e',fontWeight:'600' },
  chevron: { fontSize:11,color:'#888' },
  countryList: { backgroundColor:'#fff',borderRadius:14,borderWidth:1,borderColor:'#e0e0e8',marginBottom:8,overflow:'hidden' },
  countryOption: { padding:11,borderBottomWidth:1,borderBottomColor:'#f0f0f4' },
  countryOptionActive: { backgroundColor:'rgba(255,140,0,0.1)' },
  countryOptionText: { fontSize:13,color:'#1a1a2e',fontWeight:'600' },
  phoneRow: { flexDirection:'row',gap:8,marginBottom:16 },
  phonePrefix: { backgroundColor:'#f4f4f8',borderRadius:14,paddingHorizontal:12,justifyContent:'center',borderWidth:1,borderColor:'#e0e0e8' },
  phonePrefixText: { fontSize:15,fontWeight:'700',color:'#1a1a2e' },
  phoneInput: { flex:1,backgroundColor:'#f4f4f8',borderRadius:14,padding:12,fontSize:15,color:'#1a1a2e',borderWidth:1,borderColor:'#e0e0e8' },
  input: { backgroundColor:'#f4f4f8',borderRadius:14,padding:12,fontSize:15,color:'#1a1a2e',borderWidth:1,borderColor:'#e0e0e8',marginBottom:12 },
  inputMulti: { minHeight:72,textAlignVertical:'top' },
  mainBtn: { borderRadius:50,overflow:'hidden',marginTop:4 },
  mainBtnGrad: { padding:15,alignItems:'center' },
  mainBtnText: { color:'#fff',fontWeight:'900',fontSize:16 },
  otpRow: { flexDirection:'row',gap:8,justifyContent:'center',marginBottom:16 },
  otpBox: { width:43,height:52,borderRadius:14,backgroundColor:'#f4f4f8',borderWidth:2,borderColor:'#e0e0e8',textAlign:'center',fontSize:22,fontWeight:'900',color:'#1a1a2e' },
  otpBoxFilled: { borderColor:colors.primary,backgroundColor:'rgba(255,140,0,0.08)' },
  resendText: { color:colors.primary,fontWeight:'700',fontSize:13,textAlign:'center',paddingVertical:8 },
  backText: { color:'#888',fontSize:13,textAlign:'center',paddingVertical:6 },
  loginLink: { marginTop:16,alignItems:'center' },
  loginLinkText: { fontSize:13,color:'#555' },
  chips: { flexDirection:'row',flexWrap:'wrap',gap:8 },
  chip: { backgroundColor:'#f0f0f6',borderRadius:50,paddingHorizontal:13,paddingVertical:7,borderWidth:1,borderColor:'#e0e0e8' },
  chipText: { color:'#555',fontSize:13,fontWeight:'600' },
  chipActive: { borderRadius:50,paddingHorizontal:13,paddingVertical:7 },
  chipActiveText: { color:'#fff',fontSize:13,fontWeight:'700' },
})
