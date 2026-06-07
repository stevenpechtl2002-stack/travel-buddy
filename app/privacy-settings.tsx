import SceneBackground from '@/src/components/SceneBackground'
import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { supabase } from '@/src/lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, View, Pressable } from 'react-native'

interface PrivacySettings {
  is_private: boolean
  show_likes: boolean
  show_destinations: boolean
  show_interests: boolean
  show_religion: boolean
}

const DEFAULT: PrivacySettings = {
  is_private: false,
  show_likes: true,
  show_destinations: true,
  show_interests: true,
  show_religion: true,
}

export default function PrivacySettingsScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const router = useRouter()
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('is_private, show_likes, show_destinations, show_interests, show_religion')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings({ ...DEFAULT, ...data })
        setLoading(false)
      })
  }, [userId])

  const update = (key: keyof PrivacySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update(settings as any)
      .eq('id', userId)
    setSaving(false)
    if (error) Alert.alert('Fehler', error.message)
    else Alert.alert('Gespeichert ✓', 'Deine Datenschutzeinstellungen wurden gespeichert.', [
      { text: 'OK', onPress: () => router.back() }
    ])
  }

  const SECTIONS = [
    {
      title: 'Konto',
      items: [
        {
          key: 'is_private' as const,
          icon: '🔒',
          label: 'Privates Profil',
          desc: 'Nur Follower können dein Profil sehen',
        },
      ],
    },
    {
      title: 'Was andere sehen können',
      items: [
        { key: 'show_likes' as const, icon: '♥', label: 'Likes anzeigen', desc: 'Andere sehen welche Beiträge du geliked hast' },
        { key: 'show_destinations' as const, icon: '✈️', label: 'Reiseziele anzeigen', desc: 'Deine nächsten Reiseziele sind sichtbar' },
        { key: 'show_interests' as const, icon: '🎯', label: 'Interessen anzeigen', desc: 'Deine Interessen auf deinem Profil' },
        { key: 'show_religion' as const, icon: '🌍', label: 'Religion anzeigen', desc: 'Deine Religion auf dem Swipe-Profil' },
      ],
    },
  ]

  return (
    <SceneBackground>
      <View style={s.root}>
        {/* Header */}
        <LinearGradient colors={['#0d1b2e', '#111d2e']} style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backText}>‹</Text>
          </Pressable>
          <Text style={s.headerTitle}>Datenschutz</Text>
          <View style={{ width: 36 }} />
        </LinearGradient>

        {loading ? (
          <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>
        ) : (
          <ScrollView contentContainerStyle={s.content}>
            {SECTIONS.map(section => (
              <View key={section.title} style={s.section}>
                <Text style={s.sectionTitle}>{section.title}</Text>
                <View style={s.card}>
                  {section.items.map((item, idx) => (
                    <View key={item.key}>
                      {idx > 0 && <View style={s.divider} />}
                      <View style={s.row}>
                        <View style={s.iconWrap}>
                          <Text style={s.icon}>{item.icon}</Text>
                        </View>
                        <View style={s.textWrap}>
                          <Text style={s.label}>{item.label}</Text>
                          <Text style={s.desc}>{item.desc}</Text>
                        </View>
                        <Switch
                          value={settings[item.key]}
                          onValueChange={v => update(item.key, v)}
                          trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.1)' }}
                          thumbColor="#fff"
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <Pressable style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
              <LinearGradient colors={gradients.brand} style={s.saveBtnGrad}>
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.saveBtnText}>Speichern</Text>
                }
              </LinearGradient>
            </Pressable>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </SceneBackground>
  )
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: 14,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backText: { fontSize: 26, color: '#fff', fontWeight: '300' },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, gap: 6, paddingBottom: 60 },
  section: { gap: 8, marginTop: 16 },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 4,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 14,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(232,132,92,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  icon: { fontSize: 18 },
  textWrap: { flex: 1 },
  label: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  desc: { fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 17 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 16 },
  saveBtn: { marginTop: 24, borderRadius: 50, overflow: 'hidden' },
  saveBtnGrad: { padding: 17, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
})
