import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { supabase } from '@/src/lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Dimensions, FlatList, Image,
  Pressable, StyleSheet, Text, View,
} from 'react-native'

const { width } = Dimensions.get('window')
const CELL = (width - 2) / 3

interface Post {
  id: string
  image_url: string | null
  video_url: string | null
}

export default function HashtagScreen() {
  const { tag } = useLocalSearchParams<{ tag: string }>()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!tag) return
    setLoading(true)
    supabase
      .from('posts')
      .select('id, image_url, video_url')
      .ilike('content', `%#${tag}%`)
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data, count: c }) => {
        setPosts(data ?? [])
        setCount(c ?? (data?.length ?? 0))
        setLoading(false)
      })
  }, [tag])

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0d1b2e', '#111d2e']} style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>#{tag}</Text>
          <Text style={s.headerSub}>{posts.length} Beiträge</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : posts.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>#</Text>
          <Text style={s.emptyText}>Keine Beiträge mit #{tag}</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          numColumns={3}
          keyExtractor={p => p.id}
          columnWrapperStyle={{ gap: 1 }}
          ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
          renderItem={({ item }) => (
            <View style={s.cell}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={s.cellImg} resizeMode="cover" />
              ) : item.video_url ? (
                <View style={[s.cellImg, s.videoBg]}>
                  <Text style={s.videoIcon}>▶</Text>
                </View>
              ) : (
                <View style={[s.cellImg, s.textBg]} />
              )}
            </View>
          )}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: 14,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backText: { fontSize: 26, color: '#fff', fontWeight: '300' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  cell: { width: CELL, height: CELL },
  cellImg: { width: CELL, height: CELL },
  videoBg: { backgroundColor: '#1a2a3e', justifyContent: 'center', alignItems: 'center' },
  videoIcon: { fontSize: 24, color: 'rgba(255,255,255,0.6)' },
  textBg: { backgroundColor: '#1a2a3e' },
})
