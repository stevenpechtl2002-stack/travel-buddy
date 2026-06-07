import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { supabase } from '@/src/lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native'

interface Overview {
  name: string
  feed_name: string | null
  bio: string | null
  profile_image_url: string | null
  country: string | null
  created_at: string | null
  postCount: number
  followerCount: number
  followingCount: number
  email: string
}

export default function AccountOverviewScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const email = session?.user.email ?? ''
  const router = useRouter()
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    Promise.all([
      supabase.from('profiles').select('name, feed_name, bio, profile_image_url, country, created_at').eq('id', userId).single(),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
    ]).then(([profile, posts, followers, following]) => {
      setData({
        name: profile.data?.name ?? '',
        feed_name: profile.data?.feed_name ?? null,
        bio: profile.data?.bio ?? null,
        profile_image_url: profile.data?.profile_image_url ?? null,
        country: profile.data?.country ?? null,
        created_at: profile.data?.created_at ?? null,
        email,
        postCount: posts.count ?? 0,
        followerCount: followers.count ?? 0,
        followingCount: following.count ?? 0,
      })
      setLoading(false)
    })
  }, [userId])

  const joinDate = data?.created_at
    ? new Date(data.created_at).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    : '—'

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0d1b2e', '#111d2e']} style={s.header}>
        <Pressable onPress={() => router.navigate({ pathname: '/feed-profile', params: { openMenu: '1' } } as any)} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </Pressable>
        <Text style={s.headerTitle}>Übersicht</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={s.content}>
          {/* Avatar + name */}
          <View style={s.hero}>
            {data?.profile_image_url ? (
              <Image source={{ uri: data.profile_image_url }} style={s.avatar} />
            ) : (
              <LinearGradient colors={gradients.brand} style={s.avatarFallback}>
                <Text style={s.avatarInitial}>{(data?.name || '?').charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            )}
            <Text style={s.heroName}>{data?.feed_name || data?.name || '—'}</Text>
            {data?.country ? <Text style={s.heroSub}>📍 {data.country}</Text> : null}
            <Text style={s.heroSub}>Mitglied seit {joinDate}</Text>
          </View>

          {/* Stats */}
          <View style={s.statsCard}>
            {[
              { num: data?.postCount ?? 0, label: 'Beiträge' },
              { num: data?.followerCount ?? 0, label: 'Follower' },
              { num: data?.followingCount ?? 0, label: 'Folge ich' },
            ].map(stat => (
              <View key={stat.label} style={s.statItem}>
                <Text style={s.statNum}>{stat.num}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Info rows */}
          <Text style={s.sectionTitle}>Kontoinformationen</Text>
          <View style={s.card}>
            <InfoRow icon="📧" label="E-Mail" value={data?.email ?? '—'} />
            <InfoRow icon="👤" label="Anzeigename" value={data?.name ?? '—'} />
            <InfoRow icon="✈️" label="Feed-Name" value={data?.feed_name ?? 'Nicht gesetzt'} />
            <InfoRow icon="📝" label="Bio" value={data?.bio ?? 'Keine Bio'} last />
          </View>

          <Text style={s.sectionTitle}>Kontotyp</Text>
          <View style={s.card}>
            <InfoRow icon="🌐" label="Kontotyp" value="Persönliches Konto" />
            <InfoRow icon="📅" label="Beigetreten" value={joinDate} last />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  )
}

function InfoRow({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.row, !last && s.rowBorder]}>
      <View style={s.rowIcon}><Text style={{ fontSize: 16 }}>{icon}</Text></View>
      <View style={s.rowText}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowValue}>{value}</Text>
      </View>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, gap: 8, paddingBottom: 60 },
  hero: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 2.5, borderColor: colors.primary, marginBottom: 8 },
  avatarFallback: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarInitial: { fontSize: 36, color: '#fff', fontWeight: '900' },
  heroName: { fontSize: 22, fontWeight: '900', color: '#fff' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  statsCard: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18, padding: 20, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 4, marginTop: 12, marginBottom: 6,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  rowBorder: { borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  rowIcon: { width: 36, height: 36, borderRadius: 9, backgroundColor: 'rgba(232,132,92,0.12)', justifyContent: 'center', alignItems: 'center' },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 2 },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
})
