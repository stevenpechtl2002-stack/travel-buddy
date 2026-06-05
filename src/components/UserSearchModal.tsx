import { colors, gradients, spacing } from '../constants/theme'
import { supabase } from '../lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import {
  ActivityIndicator, FlatList, Image, Modal, Pressable,
  StyleSheet, Text, TextInput, View,
} from 'react-native'

interface Result {
  id: string
  name: string
  age: number
  country: string
  profile_image_url: string | null
  bio: string | null
}

interface Props {
  visible: boolean
  currentUserId: string
  onClose: () => void
  onSwipeRight?: (profileId: string) => void
}

export default function UserSearchModal({ visible, currentUserId, onClose, onSwipeRight }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const inputRef = useRef<TextInput>(null)
  const router = useRouter()

  const search = async (text: string) => {
    setQuery(text)
    const q = text.trim()
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, name, age, country, profile_image_url, bio')
      .neq('id', currentUserId)
      .ilike('name', `%${q}%`)
      .limit(20)
    setResults((data ?? []) as Result[])
    setLoading(false)
  }

  const handleLike = async (profile: Result) => {
    setLiked(prev => new Set(prev).add(profile.id))
    // Record the swipe in DB
    await supabase.from('swipes').upsert({
      swiper_id: currentUserId,
      swiped_id: profile.id,
      direction: 'right',
    }, { onConflict: 'swiper_id,swiped_id' })
    onSwipeRight?.(profile.id)
  }

  const handleClose = () => {
    setQuery('')
    setResults([])
    setLiked(new Set())
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.root}>
        {/* Header */}
        <LinearGradient colors={gradients.brand} style={styles.header}>
          <Text style={styles.headerTitle}>Reisende suchen</Text>
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </LinearGradient>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={query}
            onChangeText={search}
            placeholder="Name eingeben…"
            placeholderTextColor="rgba(245,240,235,0.35)"
            autoFocus
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
          {loading && <ActivityIndicator color={colors.primary} size="small" />}
        </View>

        {/* Results */}
        {query.length < 2 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✈️</Text>
            <Text style={styles.emptyTitle}>Wer reist wo?</Text>
            <Text style={styles.emptySub}>Mindestens 2 Zeichen eingeben</Text>
          </View>
        ) : results.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌍</Text>
            <Text style={styles.emptyTitle}>Niemanden gefunden</Text>
            <Text style={styles.emptySub}>Versuch einen anderen Namen</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={r => r.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isLiked = liked.has(item.id)
              return (
                <View style={styles.row}>
                  {/* Avatar */}
                  <Pressable onPress={() => { handleClose(); router.push(`/profile/${item.id}` as any) }}>
                    {item.profile_image_url ? (
                      <Image source={{ uri: item.profile_image_url }} style={styles.avatar} />
                    ) : (
                      <LinearGradient colors={gradients.brand} style={styles.avatarFallback}>
                        <Text style={styles.avatarInitial}>{item.name.charAt(0).toUpperCase()}</Text>
                      </LinearGradient>
                    )}
                  </Pressable>

                  {/* Info */}
                  <View style={styles.info}>
                    <Text style={styles.name}>{item.name}, {item.age}</Text>
                    {item.country ? <Text style={styles.country}>📍 {item.country}</Text> : null}
                    {item.bio ? (
                      <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
                    ) : null}
                  </View>

                  {/* Like button */}
                  <Pressable
                    style={[styles.likeBtn, isLiked && styles.likeBtnActive]}
                    onPress={() => !isLiked && handleLike(item)}
                    disabled={isLiked}
                  >
                    {isLiked ? (
                      <LinearGradient colors={gradients.brand} style={styles.likeBtnGrad}>
                        <Text style={styles.likeBtnText}>♥</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.likeBtnGrad}>
                        <Text style={[styles.likeBtnText, { color: colors.primary }]}>♡</Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              )
            }}
          />
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 20, paddingBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, fontWeight: '500' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 6 },
  emptySub: { fontSize: 14, color: colors.textMuted },

  list: { paddingHorizontal: spacing.md, paddingTop: 4, paddingBottom: 60, gap: 8 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 18, padding: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  avatarFallback: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 22, fontWeight: '900', color: '#fff' },

  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 2 },
  country: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  bio: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },

  likeBtn: {
    width: 44, height: 44, borderRadius: 22, overflow: 'hidden',
    backgroundColor: 'rgba(232,132,92,0.12)',
    borderWidth: 1.5, borderColor: 'rgba(232,132,92,0.3)',
  },
  likeBtnActive: { borderColor: 'transparent' },
  likeBtnGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  likeBtnText: { fontSize: 20, color: '#fff' },
})
