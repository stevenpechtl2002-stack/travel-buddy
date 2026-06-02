import { colors, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { useMatches } from '@/src/hooks/useMatches'
import { useRouter } from 'expo-router'
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

export default function MatchesScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const { matches, loading } = useMatches(userId)
  const router = useRouter()

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>

  if (matches.length === 0) return (
    <View style={styles.center}>
      <Text style={styles.empty}>💬 Noch keine Matches</Text>
      <Text style={styles.emptySub}>Swipe weiter um Reisepartner zu finden!</Text>
    </View>
  )

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Matches</Text>
      {matches.map(match => (
        <Pressable key={match.id} style={styles.row}
          onPress={() => router.push(`/chat/${match.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Chat mit ${match.other_user.name} öffnen`}>
          {match.other_user.profile_image_url
            ? <Image source={{ uri: match.other_user.profile_image_url }} style={styles.avatar}
                accessibilityLabel={`Foto von ${match.other_user.name}`} />
            : <View style={styles.avatarFallback}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>}
          <View style={styles.rowInfo}>
            <Text style={styles.rowName}>{match.other_user.name}</Text>
            <Text style={styles.rowSub}>{match.other_user.country}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  header: { fontSize: 24, fontWeight: 'bold', color: colors.primary,
    marginBottom: spacing.lg, marginTop: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: spacing.md },
  avatarFallback: { width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.border, justifyContent: 'center',
    alignItems: 'center', marginRight: spacing.md },
  avatarEmoji: { fontSize: 20 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  rowSub: { fontSize: 13, color: colors.textMuted },
  arrow: { fontSize: 20, color: colors.textMuted },
  empty: { fontSize: 18, color: colors.textMuted, marginBottom: spacing.sm },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
})
