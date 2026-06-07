import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { supabase } from '@/src/lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TextInput, View, Pressable,
} from 'react-native'

interface Info {
  name: string
  bio: string
  country: string
  phone: string
  birthday: string
  gender: string
}

const GENDERS = ['Keine Angabe', 'Männlich', 'Weiblich', 'Divers']

export default function PersonalInfoScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const email = session?.user.email ?? ''
  const router = useRouter()
  const [info, setInfo] = useState<Info>({ name: '', bio: '', country: '', phone: '', birthday: '', gender: 'Keine Angabe' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [genderOpen, setGenderOpen] = useState(false)

  useEffect(() => {
    if (!userId) return
    supabase.from('profiles')
      .select('name, bio, country, phone, birthday, gender')
      .eq('id', userId).maybeSingle()
      .then(({ data }) => {
        if (data) setInfo({
          name: data.name ?? '',
          bio: data.bio ?? '',
          country: data.country ?? '',
          phone: (data as any).phone ?? '',
          birthday: (data as any).birthday ?? '',
          gender: (data as any).gender ?? 'Keine Angabe',
        })
        setLoading(false)
      })
  }, [userId])

  const save = async () => {
    if (!info.name.trim()) { Alert.alert('Fehler', 'Name darf nicht leer sein'); return }
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      name: info.name.trim(),
      bio: info.bio.trim() || null,
      country: info.country.trim() || null,
      phone: info.phone.trim() || null,
      birthday: info.birthday.trim() || null,
      gender: info.gender,
    } as any).eq('id', userId)
    setSaving(false)
    if (error) Alert.alert('Fehler', error.message)
    else Alert.alert('Gespeichert ✓', 'Deine Angaben wurden aktualisiert.', [{ text: 'OK', onPress: () => router.navigate({ pathname: '/feed-profile', params: { openMenu: '1' } } as any) }])
  }

  const set = (key: keyof Info, val: string) => setInfo(prev => ({ ...prev, [key]: val }))

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0d1b2e', '#111d2e']} style={s.header}>
        <Pressable onPress={() => router.navigate({ pathname: '/feed-profile', params: { openMenu: '1' } } as any)} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </Pressable>
        <Text style={s.headerTitle}>Personenbezogene Angaben</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

          <Text style={s.sectionTitle}>Profil</Text>
          <View style={s.card}>
            <Field label="Name" value={info.name} onChange={v => set('name', v)} placeholder="Dein Name" />
            <View style={s.divider} />
            <Field label="Bio" value={info.bio} onChange={v => set('bio', v)} placeholder="Kurze Beschreibung" multiline />
            <View style={s.divider} />
            <Field label="Land / Herkunft" value={info.country} onChange={v => set('country', v)} placeholder="z.B. Deutschland" />
          </View>

          <Text style={s.sectionTitle}>Kontakt</Text>
          <View style={s.card}>
            {/* Email — readonly */}
            <View style={s.readRow}>
              <Text style={s.readLabel}>E-Mail</Text>
              <Text style={s.readValue}>{email}</Text>
              <Text style={s.readNote}>Nicht änderbar</Text>
            </View>
            <View style={s.divider} />
            <Field label="Telefon" value={info.phone} onChange={v => set('phone', v)} placeholder="+49 ..." keyboardType="phone-pad" />
          </View>

          <Text style={s.sectionTitle}>Persönliche Daten</Text>
          <View style={s.card}>
            <Field label="Geburtstag" value={info.birthday} onChange={v => set('birthday', v)} placeholder="TT.MM.JJJJ" keyboardType="numbers-and-punctuation" />
            <View style={s.divider} />
            {/* Gender picker */}
            <Pressable style={s.genderRow} onPress={() => setGenderOpen(v => !v)}>
              <Text style={s.fieldLabel}>Geschlecht</Text>
              <View style={s.genderRight}>
                <Text style={s.genderValue}>{info.gender}</Text>
                <Text style={s.genderArrow}>{genderOpen ? '▲' : '▼'}</Text>
              </View>
            </Pressable>
            {genderOpen && (
              <View style={s.genderOptions}>
                {GENDERS.map(g => (
                  <Pressable key={g} style={s.genderOption} onPress={() => { set('gender', g); setGenderOpen(false) }}>
                    <Text style={[s.genderOptionText, info.gender === g && { color: colors.primary, fontWeight: '800' }]}>{g}</Text>
                    {info.gender === g && <Text style={{ color: colors.primary }}>✓</Text>}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <Text style={s.infoNote}>
            Diese Angaben werden für dein Profil verwendet. Deine E-Mail-Adresse kann nur über den Support geändert werden.
          </Text>

          <Pressable style={[s.saveBtn, saving && { opacity: 0.5 }]} onPress={save} disabled={saving}>
            <LinearGradient colors={gradients.brand} style={s.saveBtnGrad}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>Speichern</Text>}
            </LinearGradient>
          </Pressable>

          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </View>
  )
}

function Field({ label, value, onChange, placeholder, multiline, keyboardType }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder: string; multiline?: boolean; keyboardType?: any
}) {
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <TextInput
        style={[f.input, multiline && f.inputMulti]}
        value={value} onChangeText={onChange}
        placeholder={placeholder} placeholderTextColor="rgba(255,255,255,0.2)"
        multiline={multiline} keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none" autoCorrect={false}
      />
    </View>
  )
}
const f = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 12 },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 },
  input: { fontSize: 15, color: '#fff', paddingVertical: 2 },
  inputMulti: { minHeight: 70, textAlignVertical: 'top' },
})

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: 14,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backText: { fontSize: 26, color: '#fff', fontWeight: '300' },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, gap: 8, paddingBottom: 60 },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 4, marginTop: 16, marginBottom: 8,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 16 },
  readRow: { paddingHorizontal: 16, paddingVertical: 12 },
  readLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 },
  readValue: { fontSize: 15, color: '#fff', fontWeight: '600', marginBottom: 2 },
  readNote: { fontSize: 11, color: 'rgba(255,255,255,0.25)' },
  fieldLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  genderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  genderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  genderValue: { fontSize: 15, color: '#fff', fontWeight: '600' },
  genderArrow: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  genderOptions: { borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  genderOption: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  genderOptionText: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  infoNote: { fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 18, marginTop: 4, paddingHorizontal: 4 },
  saveBtn: { borderRadius: 50, overflow: 'hidden', marginTop: 20 },
  saveBtnGrad: { padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
})
