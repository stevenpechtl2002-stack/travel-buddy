import { colors, spacing } from '@/src/constants/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Switch, Text, View, Pressable } from 'react-native'

interface Feature {
  icon: string
  label: string
  sub: string
  key: string
  enabled: boolean
  comingSoon?: boolean
}

export default function LinkedFeaturesScreen() {
  const router = useRouter()
  const [features, setFeatures] = useState<Feature[]>([
    { icon: '📸', label: 'Instagram', sub: 'Posts automatisch auf Instagram teilen', key: 'instagram', enabled: false, comingSoon: true },
    { icon: '🐦', label: 'X (Twitter)', sub: 'Beiträge auf X teilen', key: 'twitter', enabled: false, comingSoon: true },
    { icon: '💙', label: 'Facebook', sub: 'Mit Facebook-Konto verbinden', key: 'facebook', enabled: false, comingSoon: true },
    { icon: '▶️', label: 'YouTube', sub: 'Reisevideos verknüpfen', key: 'youtube', enabled: false, comingSoon: true },
    { icon: '🗺️', label: 'Google Maps', sub: 'Reiseziele & Orte automatisch einfügen', key: 'gmaps', enabled: false, comingSoon: true },
  ])

  const [notifications, setNotifications] = useState([
    { icon: '🔔', label: 'Push-Benachrichtigungen', sub: 'Likes, Kommentare und Follower', key: 'push', enabled: true },
    { icon: '📧', label: 'E-Mail-Benachrichtigungen', sub: 'Wöchentliche Zusammenfassung', key: 'email', enabled: false },
    { icon: '💬', label: 'Nachrichten-Benachrichtigungen', sub: 'Neue Chat-Nachrichten', key: 'messages', enabled: true },
  ])

  const toggleFeature = (key: string) => {
    setFeatures(prev => prev.map(f => {
      if (f.key !== key) return f
      if (f.comingSoon) {
        Alert.alert('Bald verfügbar', `${f.label}-Integration kommt in einer zukünftigen Version.`)
        return f
      }
      return { ...f, enabled: !f.enabled }
    }))
  }

  const toggleNotif = (key: string) => {
    setNotifications(prev => prev.map(n => n.key === key ? { ...n, enabled: !n.enabled } : n))
  }

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0d1b2e', '#111d2e']} style={s.header}>
        <Pressable onPress={() => router.navigate({ pathname: '/feed-profile', params: { openMenu: '1' } } as any)} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </Pressable>
        <Text style={s.headerTitle}>Verknüpfte Funktionen</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.sectionTitle}>Verbundene Apps</Text>
        <View style={s.card}>
          {features.map((item, i) => (
            <View key={item.key}>
              {i > 0 && <View style={s.divider} />}
              <View style={s.row}>
                <View style={s.rowIcon}><Text style={{ fontSize: 18 }}>{item.icon}</Text></View>
                <View style={s.rowText}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={s.rowLabel}>{item.label}</Text>
                    {item.comingSoon && (
                      <View style={s.badge}><Text style={s.badgeText}>Bald</Text></View>
                    )}
                  </View>
                  <Text style={s.rowSub}>{item.sub}</Text>
                </View>
                <Switch
                  value={item.enabled}
                  onValueChange={() => toggleFeature(item.key)}
                  trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.1)' }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>Benachrichtigungen</Text>
        <View style={s.card}>
          {notifications.map((item, i) => (
            <View key={item.key}>
              {i > 0 && <View style={s.divider} />}
              <View style={s.row}>
                <View style={s.rowIcon}><Text style={{ fontSize: 18 }}>{item.icon}</Text></View>
                <View style={s.rowText}>
                  <Text style={s.rowLabel}>{item.label}</Text>
                  <Text style={s.rowSub}>{item.sub}</Text>
                </View>
                <Switch
                  value={item.enabled}
                  onValueChange={() => toggleNotif(item.key)}
                  trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.1)' }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>App-Berechtigungen</Text>
        <View style={s.card}>
          {[
            { icon: '📷', label: 'Kamera', sub: 'Für Fotos und Videos', status: 'Erlaubt' },
            { icon: '🖼️', label: 'Fotobibliothek', sub: 'Zugriff auf deine Fotos', status: 'Erlaubt' },
            { icon: '📍', label: 'Standort', sub: 'Für Ortsangaben in Posts', status: 'Beim Öffnen' },
            { icon: '🔔', label: 'Mitteilungen', sub: 'Push-Benachrichtigungen senden', status: 'Erlaubt' },
          ].map((item, i, arr) => (
            <View key={item.label}>
              {i > 0 && <View style={s.divider} />}
              <Pressable style={s.row} onPress={() => Alert.alert('Berechtigungen', 'Öffne die iOS-Einstellungen → TravelBuddy, um Berechtigungen zu verwalten.')}>
                <View style={s.rowIcon}><Text style={{ fontSize: 18 }}>{item.icon}</Text></View>
                <View style={s.rowText}>
                  <Text style={s.rowLabel}>{item.label}</Text>
                  <Text style={s.rowSub}>{item.sub}</Text>
                </View>
                <Text style={s.statusText}>{item.status}</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  )
}

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
  badge: { backgroundColor: 'rgba(232,132,92,0.2)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, color: colors.primary, fontWeight: '800' },
  statusText: { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
})
