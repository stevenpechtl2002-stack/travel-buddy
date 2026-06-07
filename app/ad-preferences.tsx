import { colors, spacing } from '@/src/constants/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Switch, Text, View, Pressable } from 'react-native'

export default function AdPreferencesScreen() {
  const router = useRouter()

  const [personalizedAds, setPersonalizedAds] = useState(true)
  const [locationAds, setLocationAds] = useState(false)
  const [interestTracking, setInterestTracking] = useState(true)
  const [partnerAds, setPartnerAds] = useState(false)
  const [adFeedback, setAdFeedback] = useState(true)

  const [interests, setInterests] = useState([
    { label: '✈️ Reisen & Urlaub', active: true },
    { label: '🏨 Hotels & Unterkünfte', active: true },
    { label: '🍽️ Restaurants & Essen', active: false },
    { label: '🎭 Kultur & Events', active: true },
    { label: '🏋️ Sport & Fitness', active: false },
    { label: '👗 Mode & Shopping', active: false },
    { label: '📱 Technologie', active: true },
    { label: '🎵 Musik & Entertainment', active: false },
  ])

  const toggleInterest = (label: string) => {
    setInterests(prev => prev.map(i => i.label === label ? { ...i, active: !i.active } : i))
  }

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0d1b2e', '#111d2e']} style={s.header}>
        <Pressable onPress={() => router.navigate({ pathname: '/feed-profile', params: { openMenu: '1' } } as any)} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </Pressable>
        <Text style={s.headerTitle}>Werbepräferenzen</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={s.content}>
        {/* Info box */}
        <View style={s.infoBox}>
          <Text style={s.infoText}>
            📢 Wir nutzen deine Präferenzen, um dir relevantere Reiseangebote und Inhalte zu zeigen. Du kannst jederzeit widersprechen.
          </Text>
        </View>

        <Text style={s.sectionTitle}>Anzeigeneinstellungen</Text>
        <View style={s.card}>
          <ToggleRow
            icon="🎯" label="Personalisierte Werbung"
            sub="Anzeigen basierend auf deinem Profil und Verhalten"
            value={personalizedAds} onChange={setPersonalizedAds}
          />
          <View style={s.divider} />
          <ToggleRow
            icon="📍" label="Standortbasierte Werbung"
            sub="Anzeigen basierend auf deinem aktuellen Standort"
            value={locationAds} onChange={setLocationAds}
          />
          <View style={s.divider} />
          <ToggleRow
            icon="📊" label="Interessen-Tracking"
            sub="Wir lernen deine Interessen anhand deiner Aktivitäten"
            value={interestTracking} onChange={setInterestTracking}
          />
          <View style={s.divider} />
          <ToggleRow
            icon="🤝" label="Partner-Anzeigen"
            sub="Angebote von ausgewählten Reisepartnern"
            value={partnerAds} onChange={setPartnerAds}
          />
          <View style={s.divider} />
          <ToggleRow
            icon="💭" label="Anzeigen-Feedback"
            sub="Hilf uns, bessere Werbung zu zeigen"
            value={adFeedback} onChange={setAdFeedback}
            last
          />
        </View>

        <Text style={s.sectionTitle}>Deine Interessen</Text>
        <Text style={s.subNote}>Wähle Themen für relevantere Reiseanzeigen</Text>
        <View style={s.interestGrid}>
          {interests.map(item => (
            <Pressable key={item.label} style={[s.chip, item.active && s.chipActive]}
              onPress={() => toggleInterest(item.label)}>
              <Text style={[s.chipText, item.active && s.chipTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.sectionTitle}>Anzeigen-Aktivität</Text>
        <View style={s.card}>
          {[
            { icon: '👁', label: 'Anzeigen gesehen', value: '142 diese Woche' },
            { icon: '👆', label: 'Anzeigen angeklickt', value: '3 diese Woche' },
            { icon: '🚫', label: 'Anzeigen ausgeblendet', value: '0' },
          ].map((item, i) => (
            <View key={item.label}>
              {i > 0 && <View style={s.divider} />}
              <View style={s.statRow}>
                <Text style={s.statIcon}>{item.icon}</Text>
                <Text style={s.statLabel}>{item.label}</Text>
                <Text style={s.statValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable style={s.resetBtn} onPress={() => Alert.alert('Zurücksetzen', 'Alle Werbepräferenzen zurücksetzen?', [
          { text: 'Zurücksetzen', style: 'destructive', onPress: () => {
            setPersonalizedAds(false); setLocationAds(false)
            setInterestTracking(false); setPartnerAds(false); setAdFeedback(false)
            setInterests(prev => prev.map(i => ({ ...i, active: false })))
            Alert.alert('Zurückgesetzt', 'Deine Werbepräferenzen wurden zurückgesetzt.')
          }},
          { text: 'Abbrechen', style: 'cancel' },
        ])}>
          <Text style={s.resetText}>Alle Präferenzen zurücksetzen</Text>
        </Pressable>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  )
}

function ToggleRow({ icon, label, sub, value, onChange, last }: {
  icon: string; label: string; sub: string
  value: boolean; onChange: (v: boolean) => void; last?: boolean
}) {
  return (
    <View style={[t.row, last && { borderBottomWidth: 0 }]}>
      <View style={t.icon}><Text style={{ fontSize: 18 }}>{icon}</Text></View>
      <View style={t.text}>
        <Text style={t.label}>{label}</Text>
        <Text style={t.sub}>{sub}</Text>
      </View>
      <Switch value={value} onValueChange={onChange}
        trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.1)' }} thumbColor="#fff" />
    </View>
  )
}
const t = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  icon: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(232,132,92,0.12)', justifyContent: 'center', alignItems: 'center' },
  text: { flex: 1 },
  label: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  sub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 17 },
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
  infoBox: {
    backgroundColor: 'rgba(232,132,92,0.1)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(232,132,92,0.2)', padding: 14, marginBottom: 8,
  },
  infoText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 19 },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 4, marginTop: 16, marginBottom: 8,
  },
  subNote: { fontSize: 12, color: 'rgba(255,255,255,0.35)', paddingHorizontal: 4, marginTop: -4, marginBottom: 8 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 16 },
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: { backgroundColor: 'rgba(232,132,92,0.18)', borderColor: colors.primary },
  chipText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  chipTextActive: { color: colors.primary, fontWeight: '800' },
  statRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  statIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  statLabel: { flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  statValue: { fontSize: 13, color: colors.primary, fontWeight: '800' },
  resetBtn: {
    marginTop: 16, padding: 16, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(224,92,92,0.3)',
    backgroundColor: 'rgba(224,92,92,0.08)', alignItems: 'center',
  },
  resetText: { fontSize: 14, color: '#e05c5c', fontWeight: '700' },
})
