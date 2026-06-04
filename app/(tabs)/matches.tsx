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
      <Animated.View style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0,1], outputRange: [-20, 0] }) }] }}>
      <LinearGradient colors={['rgba(26,111,212,0.7)', 'rgba(59,157,224,0.3)']} style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Matches</Text>
          <LinearGradient colors={gradients.brandH} style={styles.countBadge}>
            <Text style={styles.countText}>{matches.length}</Text>
          </LinearGradient>
        </View>
        <Text style={styles.subtitle}>Deine Reisepartner warten auf dich ✈</Text>
      </LinearGradient>
      </Animated.View>

      {matches.length === 0 ? (
        <View style={styles.empty}>
          <LinearGradient colors={gradients.brand} style={styles.emptyIcon}>
            <Text style={{ fontSize: 36 }}>🌍</Text>
          </LinearGradient>
          <Text style={styles.emptyTitle}>Noch keine Matches</Text>
          <Text style={styles.emptyText}>Swipe weiter und finde deinen Reisepartner!</Text>
        </View>
      ) : (
        <>
          {/* New matches */}
          <Text style={styles.sectionLabel}>Neue Matches ✨</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={styles.newMatchesRow} contentContainerStyle={{ gap: 16, paddingRight: spacing.lg }}>
            {matches.slice(0, 6).map(match => (
              <Pressable key={match.id} style={styles.newMatchItem}
                onPress={() => router.push(`/chat/${match.id}`)}>
                <LinearGradient colors={gradients.brand} style={styles.avatarRing}>
                  {match.other_user.profile_image_url
                    ? <Image source={{ uri: match.other_user.profile_image_url }} style={styles.newMatchAvatar} />
                    : <View style={styles.newMatchAvatarFallback}><Text style={{ fontSize: 26 }}>👤</Text></View>}
                </LinearGradient>
                <Text style={styles.newMatchName} numberOfLines={1}>{match.other_user.name}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Conversations */}
          <Text style={styles.sectionLabel}>Nachrichten 💬</Text>
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
                    🌍 {match.other_user.country} · Schreib als Erster!
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <LinearGradient colors={gradients.brandH} style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEU</Text>
                  </LinearGradient>
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
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  countBadge: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 },
  countText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: spacing.xl },
  emptyIcon: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  emptyText: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
    paddingHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: 12 },
  newMatchesRow: { paddingLeft: spacing.lg },
  newMatchItem: { alignItems: 'center', width: 76 },
  avatarRing: { width: 70, height: 70, borderRadius: 35, padding: 3,
    marginBottom: 7, justifyContent: 'center', alignItems: 'center' },
  newMatchAvatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: colors.background },
  newMatchAvatarFallback: { width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' },
  newMatchName: { fontSize: 11, color: '#fff', fontWeight: '700', textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  list: { paddingHorizontal: spacing.lg, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  avatarBorder: { width: 58, height: 58, borderRadius: 29, padding: 2.5,
    marginRight: spacing.md, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 53, height: 53, borderRadius: 26.5, borderWidth: 2, borderColor: colors.background },
  avatarFallback: { width: 53, height: 53, borderRadius: 26.5, backgroundColor: colors.surfaceLight,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.background },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '800', color: '#1a1a2e', marginBottom: 3 },
  rowSub: { fontSize: 12, color: '#555' },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  newBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  newBadgeText: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  arrow: { fontSize: 20, color: '#888' },
})
