import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { useSaved } from '@/src/hooks/useSaved'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import {
  ActivityIndicator, FlatList, Image, Pressable,
  StyleSheet, Text, View, Dimensions,
} from 'react-native'

const { width } = Dimensions.get('window')
const COLS = 3
const CELL = (width - 2) / COLS

export default function SavedScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const router = useRouter()
  const { savedPosts, loading, loadSaved } = useSaved(userId)

  useEffect(() => { loadSaved() }, [])

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0d1b2e', '#111d2e']} style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </Pressable>
        <Text style={s.headerTitle}>Gespeichert</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : savedPosts.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔖</Text>
          <Text style={s.emptyTitle}>Noch nichts gespeichert</Text>
          <Text style={s.emptySub}>Tippe auf das Lesezeichen-Symbol bei einem Beitrag, um ihn hier zu speichern.</Text>
        </View>
      ) : (
        <FlatList
          data={savedPosts}
          keyExtractor={p => p.id}
          numColumns={COLS}
          contentContainerStyle={s.grid}
          columnWrapperStyle={{ gap: 1 }}
          ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
          renderItem={({ item }) => (
            <View style={s.cell}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={s.cellImg} resizeMode="cover" />
              ) : item.video_url ? (
                <View style={[s.cellImg, s.videoCellBg]}>
                  <Text style={s.videoIcon}>▶</Text>
                </View>
              ) : (
                <View style={[s.cellImg, s.textCell]}>
                  <Text style={s.textCellContent} numberOfLines={4}>{item.content}</Text>
                </View>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: 14,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backText: { fontSize: 26, color: '#fff', fontWeight: '300' },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 21 },
  grid: { gap: 0 },
  cell: { width: CELL, height: CELL },
  cellImg: { width: CELL, height: CELL },
  videoCellBg: { backgroundColor: '#1a2a3e', justifyContent: 'center', alignItems: 'center' },
  videoIcon: { fontSize: 28, color: 'rgba(255,255,255,0.6)' },
  textCell: { backgroundColor: '#1a2a3e', justifyContent: 'center', padding: 8 },
  textCellContent: { fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 16 },
})
