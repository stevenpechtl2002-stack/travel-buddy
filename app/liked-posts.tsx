import SceneBackground from '@/src/components/SceneBackground'
import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { supabase } from '@/src/lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native'

const { width } = Dimensions.get('window')
const CELL = (width - 3) / 3

interface LikedPost {
  id: string
  image_url: string | null
  content: string | null
  like_count: number
}

export default function LikedPostsScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const router = useRouter()
  const [posts, setPosts] = useState<LikedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<LikedPost | null>(null)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .then(async ({ data }) => {
        if (!data || data.length === 0) { setLoading(false); return }
        const ids = data.map(l => l.post_id)
        const { data: postData } = await supabase
          .from('posts')
          .select('id, image_url, content, like_count')
          .in('id', ids)
          .order('created_at', { ascending: false })
        setPosts((postData ?? []) as LikedPost[])
        setLoading(false)
      })
  }, [userId])

  return (
    <SceneBackground>
      <View style={s.root}>
        {/* Header */}
        <LinearGradient colors={['#0d1b2e', '#111d2e']} style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backText}>‹</Text>
          </Pressable>
          <Text style={s.headerTitle}>♥ Gelikte Beiträge</Text>
          <View style={{ width: 36 }} />
        </LinearGradient>

        {loading ? (
          <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>
        ) : posts.length === 0 ? (
          <View style={s.center}>
            <Text style={s.emptyEmoji}>♡</Text>
            <Text style={s.emptyTitle}>Noch keine Likes</Text>
            <Text style={s.emptySub}>Beiträge die du likest erscheinen hier</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={posts}
              numColumns={3}
              keyExtractor={p => p.id}
              contentContainerStyle={s.grid}
              ItemSeparatorComponent={() => <View style={{ height: 1.5 }} />}
              renderItem={({ item }) => (
                <Pressable style={s.cell} onPress={() => setSelected(item)}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={s.cellImg} resizeMode="cover" />
                  ) : (
                    <LinearGradient colors={['#1a2a3e', '#243a52']} style={s.cellText}>
                      <Text style={s.cellTextContent} numberOfLines={4}>{item.content}</Text>
                    </LinearGradient>
                  )}
                  <View style={s.cellOverlay}>
                    <Text style={s.cellLikes}>♥ {item.like_count}</Text>
                  </View>
                </Pressable>
              )}
            />

            {/* Detail overlay */}
            {selected && (
              <Pressable style={s.overlay} onPress={() => setSelected(null)}>
                <View style={s.overlayCard}>
                  {selected.image_url ? (
                    <Image source={{ uri: selected.image_url }} style={s.overlayImg} resizeMode="cover" />
                  ) : null}
                  {selected.content ? (
                    <Text style={s.overlayText}>{selected.content}</Text>
                  ) : null}
                  <Text style={s.overlayLikes}>♥ {selected.like_count} Likes</Text>
                  <Pressable style={s.overlayClose} onPress={() => setSelected(null)}>
                    <Text style={s.overlayCloseText}>✕ Schließen</Text>
                  </Pressable>
                </View>
              </Pressable>
            )}
          </>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyEmoji: { fontSize: 56, color: 'rgba(255,255,255,0.3)', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  grid: { paddingBottom: 60 },
  cell: {
    width: CELL, height: CELL,
    marginRight: 1.5, overflow: 'hidden',
  },
  cellImg: { width: '100%', height: '100%' },
  cellText: { width: '100%', height: '100%', padding: 8, justifyContent: 'center' },
  cellTextContent: { fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 16 },
  cellOverlay: {
    position: 'absolute', bottom: 4, left: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  cellLikes: { fontSize: 10, color: '#fff', fontWeight: '700' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center',
    padding: 24,
  },
  overlayCard: {
    backgroundColor: '#111d2e', borderRadius: 20, overflow: 'hidden',
    width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  overlayImg: { width: '100%', aspectRatio: 1 },
  overlayText: { fontSize: 15, color: '#fff', padding: 16, lineHeight: 22 },
  overlayLikes: { fontSize: 14, fontWeight: '800', color: colors.primary, paddingHorizontal: 16, paddingBottom: 8 },
  overlayClose: { margin: 16, marginTop: 4, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', padding: 12, alignItems: 'center' },
  overlayCloseText: { color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
})
