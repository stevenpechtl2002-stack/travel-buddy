import { colors, gradients, spacing } from '@/src/constants/theme'
import { supabase } from '@/src/lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TextInput, View, Pressable, Switch,
} from 'react-native'

export default function PasswordSecurityScreen() {
  const router = useRouter()
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loginActivity] = useState([
    { device: 'iPhone 15 Pro', location: 'München, Deutschland', time: 'Aktiv jetzt', current: true },
    { device: 'MacBook Pro', location: 'München, Deutschland', time: 'vor 2 Stunden', current: false },
  ])

  const changePassword = async () => {
    if (!newPw || !confirmPw) { Alert.alert('Fehler', 'Bitte alle Felder ausfüllen'); return }
    if (newPw.length < 6) { Alert.alert('Fehler', 'Passwort muss mindestens 6 Zeichen haben'); return }
    if (newPw !== confirmPw) { Alert.alert('Fehler', 'Passwörter stimmen nicht überein'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setSaving(false)
    if (error) Alert.alert('Fehler', error.message)
    else {
      Alert.alert('Gespeichert ✓', 'Dein Passwort wurde geändert.', [{ text: 'OK', onPress: () => { setCurrentPw(''); setNewPw(''); setConfirmPw('') } }])
    }
  }

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0d1b2e', '#111d2e']} style={s.header}>
        <Pressable onPress={() => router.navigate({ pathname: '/feed-profile', params: { openMenu: '1' } } as any)} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </Pressable>
        <Text style={s.headerTitle}>Passwort & Sicherheit</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={s.content}>
        {/* Change password */}
        <Text style={s.sectionTitle}>Passwort ändern</Text>
        <View style={s.card}>
          <PwField label="Neues Passwort" value={newPw} onChange={setNewPw} show={showNew} onToggle={() => setShowNew(v => !v)} />
          <View style={s.divider} />
          <PwField label="Passwort bestätigen" value={confirmPw} onChange={setConfirmPw} show={showNew} onToggle={() => setShowNew(v => !v)} last />
        </View>

        <Pressable style={[s.saveBtn, saving && { opacity: 0.5 }]} onPress={changePassword} disabled={saving}>
          <LinearGradient colors={gradients.brand} style={s.saveBtnGrad}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>Passwort speichern</Text>}
          </LinearGradient>
        </Pressable>

        {/* 2FA */}
        <Text style={s.sectionTitle}>Zwei-Faktor-Authentifizierung</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowIcon}><Text style={{ fontSize: 18 }}>📱</Text></View>
            <View style={s.rowText}>
              <Text style={s.rowLabel}>Authentifizierungs-App</Text>
              <Text style={s.rowSub}>Zusätzlicher Schutz für dein Konto</Text>
            </View>
            <Switch value={false} onValueChange={() => Alert.alert('Bald verfügbar', '2FA wird in einer kommenden Version verfügbar sein.')}
              trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.1)' }} thumbColor="#fff" />
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <View style={s.rowIcon}><Text style={{ fontSize: 18 }}>💬</Text></View>
            <View style={s.rowText}>
              <Text style={s.rowLabel}>SMS-Authentifizierung</Text>
              <Text style={s.rowSub}>Code per SMS erhalten</Text>
            </View>
            <Switch value={false} onValueChange={() => Alert.alert('Bald verfügbar', '2FA wird in einer kommenden Version verfügbar sein.')}
              trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.1)' }} thumbColor="#fff" />
          </View>
        </View>

        {/* Login activity */}
        <Text style={s.sectionTitle}>Anmeldeaktivität</Text>
        <View style={s.card}>
          {loginActivity.map((entry, i) => (
            <View key={i}>
              {i > 0 && <View style={s.divider} />}
              <View style={s.row}>
                <View style={s.rowIcon}><Text style={{ fontSize: 18 }}>{entry.current ? '📱' : '💻'}</Text></View>
                <View style={s.rowText}>
                  <Text style={s.rowLabel}>{entry.device} {entry.current ? <Text style={{ color: colors.primary }}>· Dieses Gerät</Text> : null}</Text>
                  <Text style={s.rowSub}>{entry.location}</Text>
                  <Text style={s.rowSub}>{entry.time}</Text>
                </View>
                {!entry.current && (
                  <Pressable onPress={() => Alert.alert('Abmelden', `Von ${entry.device} abmelden?`, [
                    { text: 'Abmelden', style: 'destructive', onPress: () => {} },
                    { text: 'Abbrechen', style: 'cancel' },
                  ])}>
                    <Text style={s.logoutText}>Abmelden</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Security tips */}
        <Text style={s.sectionTitle}>Sicherheitstipps</Text>
        <View style={s.tipCard}>
          <Text style={s.tip}>🔒 Verwende ein einzigartiges Passwort mit mind. 8 Zeichen</Text>
          <Text style={s.tip}>🚫 Teile dein Passwort niemals mit anderen</Text>
          <Text style={s.tip}>✅ Aktiviere die Zwei-Faktor-Authentifizierung</Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  )
}

function PwField({ label, value, onChange, show, onToggle, last }: {
  label: string; value: string; onChange: (v: string) => void
  show: boolean; onToggle: () => void; last?: boolean
}) {
  return (
    <View style={[pf.wrap, last && { borderBottomWidth: 0 }]}>
      <Text style={pf.label}>{label}</Text>
      <View style={pf.inputRow}>
        <TextInput
          style={pf.input} value={value} onChangeText={onChange}
          secureTextEntry={!show} placeholder="••••••••"
          placeholderTextColor="rgba(255,255,255,0.2)"
          autoCapitalize="none" autoCorrect={false}
        />
        <Pressable onPress={onToggle} hitSlop={12}>
          <Text style={pf.eye}>{show ? '🙈' : '👁'}</Text>
        </Pressable>
      </View>
    </View>
  )
}
const pf = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 12 },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontSize: 15, color: '#fff', paddingVertical: 4 },
  eye: { fontSize: 18, paddingLeft: 8 },
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
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  rowIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(232,132,92,0.12)', justifyContent: 'center', alignItems: 'center' },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  rowSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 17 },
  saveBtn: { borderRadius: 50, overflow: 'hidden', marginTop: 4 },
  saveBtnGrad: { padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  logoutText: { fontSize: 13, color: '#e05c5c', fontWeight: '700' },
  tipCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 16, gap: 10,
  },
  tip: { fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 19 },
})
