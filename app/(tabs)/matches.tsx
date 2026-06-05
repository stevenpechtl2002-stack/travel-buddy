import SceneBackground from '@/src/components/SceneBackground'
import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { useMatches } from '@/src/hooks/useMatches'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { ActivityIndicator, Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

export default function MatchesScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const { matches, loading } = useMatches(userId)
  const router = useRouter()
  const headerAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start()
  }, [])

  if (loading) return (
    <SceneBackground>
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    </SceneBackground>
  )

  return (
    <SceneBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <Animated.View style={{
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
        }}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Matches</Text>
              <Text style={styles.subtitle}>Deine Reisepartner</Text>
            </View>
            <LinearGradient colors={gradients.brand} style={styles.countBadge}>
              <Text style={styles.countText}>{matches.length}</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {matches.length === 0 ? (
          <View style={styles.empty}>
            <LinearGradient colors={gradients.brand} style={styles.emptyIcon}>
              <Text style={{ fontSize: 36 }}>✈</Text>
            </LinearGradient>
            <Text style={styles.emptyTitle}>Noch keine Matches</Text>
            <Text style={styles.emptyText}>Swipe und finde deinen Reisepartner!</Text>
          </View>
        ) : (
          <>
            {/* Bubble row */}
            <Text style={styles.sectionLabel}>Neue Matches</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={styles.newMatchesRow} contentContainerStyle={{ gap: 14, paddingRight: spacing.lg }}>
              {matches.slice(0, 8).map(match => (
                <Pressable key={match.id} style={styles.newMatchItem}
                  onPress={() => router.push(`/chat/${match.id}`)}>
                  <LinearGradient colors={gradients.brand} style={styles.avatarRing}>
                    {match.other_user.profile_image_url
                      ? <Image source={{ uri: match.other_user.profile_image_url }} style={styles.newMatchAvatar} />
                      : <View style={styles.newMatchAvatarFallback}><Text style={{ fontSize: 24 }}>👤</Text></View>}
                  </LinearGradient>
                  <Text style={styles.newMatchName} numberOfLines={1}>{match.other_user.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Conversation list */}
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Nachrichten</Text>
            <View style={styles.list}>
              {matches.map(match => (
                <Pressable key={match.id} style={styles.row}
                  onPress={() => router.push(`/chat/${match.id}`)}>
                  <LinearGradient colors={gradients.brand} style={styles.avatarBorder}>
                    {match.other_user.profile_image_url
                      ? <Image source={{ uri: match.other_user.profile_image_url }} style={styles.avatar} />
                      : <View style={styles.avatarFallback}><Text style={{ fontSize: 22 }}>👤</Text></View>}
                  </LinearGradient>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName}>{match.other_user.name}, {match.other_user.age}</Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {match.other_user.country} · Schreib als Erster!
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEU</Text>
                    </View>
                    <Text style={styles.arrow}>›</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SceneBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 120 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 64, paddingBottom: 20,
  },
  title: { fontSize: 32, fontWeight: '900', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  countBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  countText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: spacing.xl },
  emptyIcon: { width: 86, height: 86, borderRadius: 43, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 1,
    textTransform: 'uppercase', paddingHorizontal: spacing.lg, marginBottom: 12,
  },
  newMatchesRow: { paddingLeft: spacing.lg },
  newMatchItem: { alignItems: 'center', width: 72 },
  avatarRing: {
    width: 66, height: 66, borderRadius: 33, padding: 2.5,
    marginBottom: 6, justifyContent: 'center', alignItems: 'center',
  },
  newMatchAvatar: { width: 61, height: 61, borderRadius: 30.5 },
  newMatchAvatarFallback: {
    width: 61, height: 61, borderRadius: 30.5,
    backgroundColor: 'rgba(245,240,235,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  newMatchName: { fontSize: 11, color: colors.text, fontWeight: '700', textAlign: 'center' },
  list: { paddingHorizontal: spacing.lg, gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(245,240,235,0.07)', borderRadius: 20, padding: 14,
    borderWidth: 1, borderColor: 'rgba(245,240,235,0.1)',
  },
  avatarBorder: {
    width: 56, height: 56, borderRadius: 28, padding: 2,
    marginRight: spacing.md, justifyContent: 'center', alignItems: 'center',
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(245,240,235,0.1)', justifyContent: 'center', alignItems: 'center',
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 3 },
  rowSub: { fontSize: 12, color: colors.textMuted },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  newBadge: {
    backgroundColor: 'rgba(232,132,92,0.2)', borderRadius: 8, borderWidth: 1,
    borderColor: 'rgba(232,132,92,0.4)', paddingHorizontal: 7, paddingVertical: 3,
  },
  newBadgeText: { fontSize: 9, fontWeight: '900', color: colors.primary, letterSpacing: 0.6 },
  arrow: { fontSize: 20, color: colors.textMuted },
})
