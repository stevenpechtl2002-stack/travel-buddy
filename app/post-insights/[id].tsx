import { colors, gradients, spacing } from '@/src/constants/theme'
import { supabase } from '@/src/lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Image, Pressable,
  StyleSheet, Text, View,
} from 'react-native'

interface Insights {
  like_count: number
  comment_count: number
  repost_count: number
  save_count: number
  image_url: string | null
  content: string | null
  created_at: string
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={[s.statValue, { color }]}>{value.toLocaleString('de-DE')}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  )
}

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d === 0) return 'Heute'
  if (d === 1) return 'Gestern'
  return `vor ${d} Tagen`
}

export default function PostInsightsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [insights, setInsights] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('posts').select('like_count, comment_count, repost_count, image_url, content, created_at').eq('id', id).single(),
      supabase.from('saved_posts').select('id', { count: 'exact', head: true }).eq('post_id', id),
    ]).then(([postRes, savedRes]) => {
      if (postRes.data) {
        setInsights({
          ...postRes.data,
          save_count: savedRes.count ?? 0,
        })
      }
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  )

  if (!insights) return null

  const total = insights.like_count + insights.comment_count + insights.repost_count + insights.save_count

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0d1b2e', '#111d2e']} style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </Pressable>
        <Text style={s.headerTitle}>Beitrag-Insights</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <View style={s.postPreview}>
        {insights.image_url && (
          <Image source={{ uri: insights.image_url }} style={s.previewImg} resizeMode="cover" />
        )}
        <View style={{ flex: 1 }}>
          {insights.content ? (
            <Text style={s.previewText} numberOfLines={2}>{insights.content}</Text>
          ) : null}
          <Text style={s.previewDate}>{timeAgo(insights.created_at)}</Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>Interaktionen</Text>
      <View style={s.statsGrid}>
        <StatCard icon="♥" label="Likes" value={insights.like_count} color="#ff3b30" />
        <StatCard icon="💬" label="Kommentare" value={insights.comment_count} color={colors.primary} />
        <StatCard icon="↗" label="Geteilt" value={insights.repost_count} color="#30d158" />
        <StatCard icon="🔖" label="Gespeichert" value={insights.save_count} color="#ffd60a" />
      </View>

      <View style={s.totalCard}>
        <Text style={s.totalLabel}>Gesamt-Interaktionen</Text>
        <Text style={s.totalValue}>{total.toLocaleString('de-DE')}</Text>
      </View>

      <View style={s.engagementCard}>
        <Text style={s.engLabel}>Engagement-Rate</Text>
        <Text style={s.engValue}>
          {total > 0 ? ((total / Math.max(insights.like_count + 1, 10)) * 100).toFixed(1) : '0'}%
        </Text>
        <Text style={s.engSub}>Basierend auf Interaktionen</Text>
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
  postPreview: {
    flexDirection: 'row', gap: 12, margin: 16,
    backgroundColor: colors.surface, borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  previewImg: { width: 60, height: 60, borderRadius: 10 },
  previewText: { fontSize: 13, color: colors.text, lineHeight: 18, flex: 1 },
  previewDate: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: 16, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: 16, marginBottom: 16 },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: colors.surface,
    borderRadius: 16, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  statIcon: { fontSize: 28, marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
  statLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  totalCard: {
    marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 16,
    padding: 16, alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  totalLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginBottom: 6 },
  totalValue: { fontSize: 36, fontWeight: '900', color: colors.text },
  engagementCard: {
    marginHorizontal: 16, borderRadius: 16, overflow: 'hidden',
    backgroundColor: colors.surface, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(232,132,92,0.2)',
  },
  engLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginBottom: 4 },
  engValue: { fontSize: 36, fontWeight: '900', color: colors.primary, marginBottom: 4 },
  engSub: { fontSize: 11, color: colors.textMuted },
})
