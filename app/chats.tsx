import { colors, gradients, spacing } from '@/src/constants/theme'
import { useFollow } from '@/src/hooks/useFollow'
import { useAuth } from '@/src/hooks/useAuth'
import { useMatches } from '@/src/hooks/useMatches'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator, FlatList, Image, Pressable,
  RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native'

function Avatar({ uri, size = 44, name = '?' }: { uri?: string | null; size?: number; name?: string }) {
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  return (
    <LinearGradient colors={gradients.brand}
      style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '900', fontSize: size * 0.38 }}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </LinearGradient>
  )
}

function timeShort(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'jetzt'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

// ── Bottom tab bar ────────────────────────────────────────────
function ChatsTabBar() {
  const router = useRouter()
  const tabs = [
    { key: 'home',    icon: '⌂',  label: 'Home',    route: '/feed' },
    { key: 'chat',    icon: '💬', label: 'Chat',    route: '/chats' },
    { key: 'search',  icon: '⊙',  label: 'Suchen',  route: '/explore' },
    { key: 'profile', icon: '◯',  label: 'Profil',  route: '/(tabs)/profile' },
  ] as const
  return (
    <View style={navStyles.wrapper}>
      <View style={navStyles.glow} />
      {tabs.map(tab => {
        const focused = tab.key === 'chat'
        return (
          <Pressable key={tab.key} style={navStyles.tab} onPress={() => router.push(tab.route as any)}>
            {focused ? (
              <LinearGradient colors={gradients.brand} style={navStyles.pill}>
                <Text style={navStyles.activeIcon}>{tab.icon}</Text>
              </LinearGradient>
            ) : (
              <Text style={navStyles.inactiveIcon}>{tab.icon}</Text>
            )}
            <Text style={[navStyles.label, focused && navStyles.labelActive]}>{tab.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}
const navStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row',
    backgroundColor: '#111d2e', paddingTop: 10, paddingBottom: 30,
    borderTopWidth: 1, borderColor: 'rgba(232,132,92,0.18)',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 20,
  },
  glow: { position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, backgroundColor: 'rgba(232,132,92,0.2)' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  pill: { width: 44, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  activeIcon: { fontSize: 20, color: '#fff', fontWeight: '700' },
  inactiveIcon: { fontSize: 20, color: 'rgba(245,240,235,0.28)' },
  label: { fontSize: 10, fontWeight: '600', color: 'rgba(245,240,235,0.35)' },
  labelActive: { color: '#e8845c', fontWeight: '800' },
})

// ── Main screen ───────────────────────────────────────────────
export default function ChatsScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const { matches, loading, refresh } = useMatches(userId)
  const { suggested, follow, unfollow, isFollowing } = useFollow(userId)
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const doRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  const filtered = matches.filter(m =>
    m.other_user.name.toLowerCase().includes(search.toLowerCase())
  )

  function SuggestedCard({ user }: { user: typeof suggested[0] }) {
    const followed = isFollowing(user.id)
    return (
      <View style={styles.sugCard}>
        <Avatar uri={user.profile_image_url} name={user.name} size={64} />
        <Text style={styles.sugName} numberOfLines={1}>{user.name}</Text>
        <Text style={styles.sugSub} numberOfLines={1}>{user.country ?? ''}</Text>
        <Pressable
          style={[styles.followBtn, followed && styles.followBtnFollowed]}
          onPress={() => followed ? unfollow(user.id) : follow(user.id)}
        >
          {followed ? (
            <Text style={styles.followBtnFollowedText}>Gefolgt ✓</Text>
          ) : (
            <LinearGradient colors={gradients.brand} style={styles.followBtnGrad}>
              <Text style={styles.followBtnText}>Folgen</Text>
            </LinearGradient>
          )}
        </Pressable>
      </View>
    )
  }

  function DmRow({ match }: { match: typeof matches[0] }) {
    const u = match.other_user
    const isDemo = u.id.startsWith('demo-')
    return (
      <Pressable style={styles.dmRow} onPress={() => router.push(`/chat/${match.id}`)}>
        <View style={styles.dmAvatarWrap}>
          <LinearGradient colors={gradients.brand} style={styles.dmRing}>
            <Avatar uri={u.profile_image_url} name={u.name} size={50} />
          </LinearGradient>
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.dmInfo}>
          <Text style={styles.dmName}>{u.name}{u.age ? `, ${u.age}` : ''}</Text>
          <Text style={styles.dmPreview} numberOfLines={1}>
            {isDemo ? '👋 Schreib als Erster!' : `📍 ${u.country ?? 'Reisepartner'} · Tippe zum Chatten`}
          </Text>
        </View>
        <View style={styles.dmRight}>
          <Text style={styles.dmTime}>{timeShort(match.created_at)}</Text>
          <View style={styles.unreadDot} />
        </View>
      </Pressable>
    )
  }

  function ListHeader() {
    return (
      <>
        {/* Story-style match bubbles */}
        {matches.length > 0 && (
          <View style={styles.bubblesSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bubblesRow}>
              {matches.slice(0, 10).map(match => (
                <Pressable key={match.id} style={styles.bubble}
                  onPress={() => router.push(`/chat/${match.id}`)}>
                  <LinearGradient colors={gradients.brand} style={styles.bubbleRing}>
                    <Avatar uri={match.other_user.profile_image_url} name={match.other_user.name} size={56} />
                  </LinearGradient>
                  <Text style={styles.bubbleName} numberOfLines={1}>
                    {match.other_user.name.split(' ')[0]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Suggested people */}
        {suggested.length > 0 && (
          <View style={styles.sugSection}>
            <Text style={styles.sectionLabel}>Vorgeschlagen</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sugRow}>
              {suggested.slice(0, 8).map(u => <SuggestedCard key={u.id} user={u} />)}
            </ScrollView>
          </View>
        )}

        <View style={styles.dmDivider}>
          <Text style={styles.sectionLabel}>Nachrichten</Text>
        </View>
      </>
    )
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <Pressable style={styles.headerIcon} onPress={() => router.push('/explore')}>
          <Text style={styles.headerIconText}>✎</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIconText}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Suchen…"
          placeholderTextColor="rgba(245,240,235,0.3)"
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={doRefresh}
              tintColor={colors.primary} colors={[colors.primary]} />
          }
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyTitle}>Noch keine Chats</Text>
              <Text style={styles.emptySub}>Swipe und finde deinen Reisepartner!</Text>
              <Pressable onPress={() => router.push('/(tabs)/discover')}
                style={{ borderRadius: 50, overflow: 'hidden', marginTop: 20 }}>
                <LinearGradient colors={gradients.brand}
                  style={{ paddingHorizontal: 28, paddingVertical: 13 }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Entdecken</Text>
                </LinearGradient>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => <DmRow match={item} />}
        />
      )}

      <ChatsTabBar />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 62, paddingBottom: 10,
    borderBottomWidth: 1, borderColor: 'rgba(245,240,235,0.07)',
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: colors.text },
  headerIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(245,240,235,0.09)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(245,240,235,0.13)',
  },
  headerIconText: { fontSize: 17, color: colors.text },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    margin: spacing.md, marginTop: 10,
    backgroundColor: 'rgba(245,240,235,0.08)',
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(245,240,235,0.1)',
  },
  searchIconText: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  list: { paddingBottom: 120 },
  bubblesSection: { marginBottom: 4 },
  bubblesRow: { paddingHorizontal: spacing.lg, paddingVertical: 12, gap: 16 },
  bubble: { alignItems: 'center', width: 68 },
  bubbleRing: { width: 68, height: 68, borderRadius: 34, padding: 3, marginBottom: 6 },
  bubbleName: { fontSize: 11, color: colors.text, fontWeight: '700', textAlign: 'center' },
  sugSection: { marginBottom: 4 },
  sugRow: { paddingHorizontal: spacing.lg, gap: 10, paddingBottom: 4 },
  sugCard: {
    width: 130, backgroundColor: 'rgba(245,240,235,0.07)',
    borderRadius: 18, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(245,240,235,0.1)',
  },
  sugName: { fontSize: 13, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 8, marginBottom: 2 },
  sugSub: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginBottom: 10 },
  followBtn: { borderRadius: 20, overflow: 'hidden', width: '100%' },
  followBtnGrad: { paddingVertical: 7, alignItems: 'center' },
  followBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  followBtnFollowed: {
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(245,240,235,0.25)',
    paddingVertical: 7, alignItems: 'center',
  },
  followBtnFollowedText: { color: colors.textMuted, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: colors.textMuted,
    letterSpacing: 1, textTransform: 'uppercase',
    paddingHorizontal: spacing.lg, marginBottom: 8,
  },
  dmDivider: { paddingBottom: 10, paddingTop: 4 },
  dmRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: 'rgba(245,240,235,0.05)',
  },
  dmAvatarWrap: { position: 'relative', marginRight: 14 },
  dmRing: { borderRadius: 30, padding: 2.5 },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#4ade80', borderWidth: 2, borderColor: colors.background,
  },
  dmInfo: { flex: 1 },
  dmName: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 3 },
  dmPreview: { fontSize: 13, color: colors.textMuted },
  dmRight: { alignItems: 'flex-end', gap: 6, marginLeft: 8 },
  dmTime: { fontSize: 11, color: colors.textMuted },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
})
