import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { supabase } from '@/src/lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, Dimensions, FlatList, Image,
  Pressable, StyleSheet, Text, View,
} from 'react-native'

const { width } = Dimensions.get('window')
const CELL = (width - 2) / 3

interface ArchivedPost {
  id: string
  image_url: string | null
  video_url: string | null
  content: string | null
  created_at: string
}

export default function ArchiveScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const router = useRouter()
  const [posts, setPosts] = useState<ArchivedPost[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('posts')
      .select('id, image_url, video_url, content, created_at')
      .eq('user_id', userId)
      .eq('archived', true)
      .order('created_at', { ascending: false })
    setPosts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (userId) load() }, [userId])

  const unarchive = async (postId: string) => {
    Alert.alert('Archiv', 'Beitrag wieder veröffentlichen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Veröffentlichen', onPress: async () => {
          await supabase.from('posts').update({ archived: false }).eq('id', postId)
          setPosts(prev => prev.filter(p => p.id !== postId))
        }
      },
    ])
  }

  const deleteForever = async (postId: string) => {
    Alert.alert('Löschen', 'Beitrag dauerhaft löschen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen', style: 'destructive', onPress: async () => {
          await supabase.from('posts').delete().eq('id', postId)
          setPosts(prev => prev.filter(p => p.id !== postId))
        }
      },
    ])
  }

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0d1b2e', '#111d2e']} style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </Pressable>
        <Text style={s.headerTitle}>Archiv</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <View style={s.infoBanner}>
        <Text style={s.infoText}>
          🗄 Archivierte Beiträge sind nur für dich sichtbar. Tippe lang, um Optionen zu sehen.
        </Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : posts.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🗄</Text>
          <Text style={s.emptyTitle}>Archiv ist leer</Text>
          <Text style={s.emptySub}>Archivierte Beiträge erscheinen hier. Du kannst Beiträge über das ••• Menü archivieren.</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          numColumns={3}
          keyExtractor={p => p.id}
          columnWrapperStyle={{ gap: 1 }}
          ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
          renderItem={({ item }) => (
            <Pressable
              style={s.cell}
              onLongPress={() => Alert.alert('Beitrag', '', [
                { text: 'Wieder veröffentlichen', onPress: () => unarchive(item.id) },
                { text: 'Dauerhaft löschen', style: 'destructive', onPress: () => deleteForever(item.id) },
                { text: 'Abbrechen', style: 'cancel' },
              ])}
            >
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={s.cellImg} resizeMode="cover" />
              ) : item.video_url ? (
                <View style={[s.cellImg, s.videoBg]}>
                  <Text style={s.videoIcon}>▶</Text>
                </View>
              ) : (
                <View style={[s.cellImg, s.textBg]}>
                  <Text style={s.textContent} numberOfLines={4}>{item.content}</Text>
                </View>
              )}
              <View style={s.archiveBadge}>
                <Text style={s.archiveBadgeText}>🗄</Text>
              </View>
            </Pressable>
          )}
        />
      )}
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
  infoBanner: {
    backgroundColor: 'rgba(255,255,255,0.05)', margin: 12, borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  infoText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 19 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 21 },
  cell: { width: CELL, height: CELL, position: 'relative' },
  cellImg: { width: CELL, height: CELL },
  videoBg: { backgroundColor: '#1a2a3e', justifyContent: 'center', alignItems: 'center' },
  videoIcon: { fontSize: 24, color: 'rgba(255,255,255,0.6)' },
  textBg: { backgroundColor: '#1a2a3e', justifyContent: 'center', padding: 8 },
  textContent: { fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 16 },
  archiveBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: 2,
  },
  archiveBadgeText: { fontSize: 12 },
})
