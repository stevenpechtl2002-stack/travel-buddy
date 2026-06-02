import PremiumBadge from '@/src/components/PremiumBadge'
import { colors, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { useProfile } from '@/src/hooks/useProfile'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Profile, TravelDestination, UserInterest } from '@/src/types'

export default function ProfileScreen() {
  const { session, signOut } = useAuth()
  const { getFullProfile } = useProfile()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [destinations, setDestinations] = useState<TravelDestination[]>([])
  const [interests, setInterests] = useState<UserInterest[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!session) return
    getFullProfile(session.user.id).then(({ profile, destinations, interests }) => {
      setProfile(profile)
      setDestinations(destinations)
      setInterests(interests)
      setLoading(false)
    })
  }, [session])

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
  if (!profile) return null

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {profile.profile_image_url
          ? <Image source={{ uri: profile.profile_image_url }} style={styles.avatar}
              accessibilityLabel="Dein Profilfoto" />
          : <View style={styles.avatarFallback}><Text style={{ fontSize: 40 }}>👤</Text></View>}
        <Text style={styles.name}>{profile.name}{profile.age ? `, ${profile.age}` : ''}</Text>
        <Text style={styles.country}>{profile.country}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          {profile.verified && <Text style={styles.badge}>✅ Verifiziert</Text>}
          {profile.is_premium && <PremiumBadge />}
        </View>
      </View>

      {profile.bio ? <Text style={styles.bio}>"{profile.bio}"</Text> : null}

      {destinations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌍 Reiseziele</Text>
          {destinations.map((d, i) => (
            <Text key={i} style={styles.item}>
              {d.country}{d.city ? ` · ${d.city}` : ''}{d.date_from ? ` (${d.date_from})` : ''}
            </Text>
          ))}
        </View>
      )}

      {interests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Interessen</Text>
          <View style={styles.chips}>
            {interests.map(i => (
              <View key={i.interest} style={styles.chip}>
                <Text style={styles.chipText}>{i.interest}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Pressable style={styles.editBtn} onPress={() => router.push('/onboarding/basics')}
        accessibilityRole="button" accessibilityLabel="Profil bearbeiten">
        <Text style={styles.editBtnText}>✏️ Profil bearbeiten</Text>
      </Pressable>
      <Pressable style={styles.logoutBtn} onPress={signOut}
        accessibilityRole="button" accessibilityLabel="Abmelden">
        <Text style={styles.logoutText}>Abmelden</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.lg, marginTop: spacing.lg },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: spacing.md },
  avatarFallback: { width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.surface, justifyContent: 'center',
    alignItems: 'center', marginBottom: spacing.md },
  name: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  country: { fontSize: 15, color: colors.textMuted },
  badge: { fontSize: 13, color: colors.text },
  bio: { fontSize: 15, color: colors.textMuted, fontStyle: 'italic',
    textAlign: 'center', marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text,
    marginBottom: spacing.sm },
  item: { fontSize: 15, color: colors.text, marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#fff3e0', borderRadius: 9999,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  chipText: { color: colors.primary, fontSize: 13 },
  editBtn: { backgroundColor: colors.primary, borderRadius: 12,
    padding: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  editBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  logoutBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    padding: spacing.md, alignItems: 'center' },
  logoutText: { color: colors.textMuted, fontSize: 15 },
})
