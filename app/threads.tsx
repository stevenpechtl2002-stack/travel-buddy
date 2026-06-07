import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { supabase } from '@/src/lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import {
  ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView,
  Modal, Platform, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''

interface ThreadPost {
  id: string
  user_id: string
  content: string
  image_url: string | null
  location: string | null
  like_count: number
  comment_count: number
  created_at: string
  author: { name: string; profile_image_url: string | null }
}

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'gerade eben'
  if (secs < 3600) return `vor ${Math.floor(secs / 60)} Min`
  if (secs < 86400) return `vor ${Math.floor(secs / 3600)} Std`
  return `vor ${Math.floor(secs / 86400)} Tagen`
}

function Avatar({ uri, size = 40, name = '?' }: { uri?: string | null; size?: number; name?: string }) {
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  return (
    <LinearGradient colors={gradients.brand} style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '900', fontSize: size * 0.4 }}>{name.charAt(0).toUpperCase()}</Text>
    </LinearGradient>
  )
}

// ── Compose Modal ─────────────────────────────────────────────
function ComposeModal({ visible, userId, onClose, onDone }: {
  visible: boolean; userId: string; onClose: () => void; onDone: () => void
}) {
  const [text, setText] = useState('')
  const [location, setLocation] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)

  const reset = () => { setText(''); setLocation(''); setImageUri(null) }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.85 })
    if (!res.canceled) setImageUri(res.assets[0].uri)
  }

  const uploadImage = async (uri: string): Promise<string> => {
    const ext = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? 'jpg'
    const fname = `threads/${userId}/${Date.now()}.${ext}`
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) throw new Error('Nicht eingeloggt')
    const res = await FileSystem.uploadAsync(
      `${SUPABASE_URL}/storage/v1/object/profile-images/${fname}`, uri,
      { httpMethod: 'POST', uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' } }
    )
    if (res.status < 200 || res.status >= 300) throw new Error(`Upload ${res.status}`)
    return supabase.storage.from('profile-images').getPublicUrl(fname).data.publicUrl
  }

  const handlePost = async () => {
    if (!text.trim() && !imageUri) { Alert.alert('', 'Schreib etwas oder füge ein Bild hinzu'); return }
    setPosting(true)
    try {
      let imgUrl: string | null = null
      if (imageUri) imgUrl = await uploadImage(imageUri)
      const { error } = await supabase.from('posts').insert({
        user_id: userId,
        content: text.trim() || null,
        image_url: imgUrl,
        location: location.trim() || null,
        type: 'thread',
        like_count: 0, repost_count: 0, comment_count: 0,
      })
      if (error) throw new Error(error.message)
      reset(); onClose(); onDone()
    } catch (e: any) {
      Alert.alert('Fehler', e.message)
    } finally {
      setPosting(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={cs.root}>
          <View style={cs.header}>
            <Pressable onPress={() => { reset(); onClose() }}>
              <Text style={cs.cancel}>Abbrechen</Text>
            </Pressable>
            <Text style={cs.title}>Neuer Thread</Text>
            <Pressable onPress={handlePost} disabled={posting} style={cs.postBtn}>
              <LinearGradient colors={gradients.brand} style={cs.postBtnGrad}>
                {posting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={cs.postBtnText}>Posten</Text>}
              </LinearGradient>
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
            <TextInput
              style={cs.input}
              value={text}
              onChangeText={setText}
              placeholder="Was denkst du? 💭"
              placeholderTextColor="rgba(245,240,235,0.3)"
              multiline
              autoFocus
            />
            {imageUri ? (
              <View style={{ position: 'relative', marginBottom: 12 }}>
                <Image source={{ uri: imageUri }} style={cs.imgPreview} resizeMode="cover" />
                <Pressable style={cs.removeImg} onPress={() => setImageUri(null)}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>✕</Text>
                </Pressable>
              </View>
            ) : null}
            <TextInput
              style={cs.locationInput}
              value={location}
              onChangeText={setLocation}
              placeholder="📍 Ort (optional)"
              placeholderTextColor="rgba(245,240,235,0.3)"
            />
          </ScrollView>
          <View style={cs.toolbar}>
            <Pressable style={cs.toolbarBtn} onPress={pickImage}>
              <Text style={cs.toolbarIcon}>🖼</Text>
              <Text style={cs.toolbarLabel}>Foto</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
const cs = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1b2e', padding: 20, paddingBottom: 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  cancel: { fontSize: 15, color: colors.textMuted, fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '900', color: colors.text },
  postBtn: { borderRadius: 20, overflow: 'hidden' },
  postBtnGrad: { paddingHorizontal: 18, paddingVertical: 8 },
  postBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  input: { fontSize: 17, color: colors.text, lineHeight: 26, minHeight: 100, textAlignVertical: 'top', marginBottom: 12 },
  imgPreview: { width: '100%', height: 200, borderRadius: 14 },
  removeImg: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  locationInput: { fontSize: 14, color: colors.textMuted, borderTopWidth: 1, borderColor: 'rgba(245,240,235,0.08)', paddingTop: 12, paddingBottom: 12 },
  toolbar: { flexDirection: 'row', paddingVertical: 12, borderTopWidth: 1, borderColor: 'rgba(245,240,235,0.08)', paddingBottom: 30 },
  toolbarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toolbarIcon: { fontSize: 22 },
  toolbarLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
})

// ── Thread Card ───────────────────────────────────────────────
function ThreadCard({ post, currentUserId, onDelete }: {
  post: ThreadPost; currentUserId: string; onDelete: () => void
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Avatar uri={post.author.profile_image_url} name={post.author.name} size={42} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.authorName}>{post.author.name}</Text>
          <View style={styles.metaRow}>
            {post.location ? <Text style={styles.metaText}>📍 {post.location} · </Text> : null}
            <Text style={styles.metaText}>{timeAgo(post.created_at)}</Text>
          </View>
        </View>
        {post.user_id === currentUserId && (
          <Pressable onPress={onDelete} style={styles.deleteBtn}>
            <Text style={{ color: colors.textMuted, fontSize: 18 }}>···</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.threadBody}>
        <View style={styles.accentBar} />
        <View style={{ flex: 1 }}>
          {post.content ? <Text style={styles.threadText}>{post.content}</Text> : null}
          {post.image_url ? (
            <Image source={{ uri: post.image_url }} style={styles.threadImage} resizeMode="cover" />
          ) : null}
        </View>
      </View>
      <View style={styles.actions}>
        <View style={styles.actionItem}>
          <Text style={styles.actionIcon}>♡</Text>
          <Text style={styles.actionCount}>{post.like_count > 0 ? post.like_count : ''}</Text>
        </View>
        <View style={styles.actionItem}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{post.comment_count > 0 ? post.comment_count : ''}</Text>
        </View>
      </View>
    </View>
  )
}

// ── Tab Bar ───────────────────────────────────────────────────
function ThreadsTabBar() {
  const router = useRouter()
  const tabs = [
    { key: 'home',     icon: '⌂',  label: 'Home',      route: '/feed',            center: false },
    { key: 'chat',     icon: '💬', label: 'Chat',      route: '/chats',           center: false },
    { key: 'discover', icon: '✦',  label: 'Entdecken', route: '/(tabs)/discover', center: true  },
    { key: 'search',   icon: '⊙',  label: 'Suchen',    route: '/explore',         center: false },
    { key: 'profile',  icon: '◯',  label: 'Profil',    route: '/feed-profile',    center: false },
  ] as const
  return (
    <View style={navS.wrapper}>
      <View style={navS.glow} />
      {tabs.map(tab => {
        if (tab.center) return (
          <Pressable key={tab.key} style={navS.tab} onPress={() => router.push(tab.route as any)}>
            <View style={navS.discoverWrap}>
              <LinearGradient colors={gradients.brand} style={navS.discoverBtn}>
                <Text style={navS.discoverIcon}>{tab.icon}</Text>
              </LinearGradient>
            </View>
            <Text style={[navS.label, navS.discoverLabel]}>{tab.label}</Text>
          </Pressable>
        )
        return (
          <Pressable key={tab.key} style={navS.tab} onPress={() => router.push(tab.route as any)}>
            <Text style={navS.inactiveIcon}>{tab.icon}</Text>
            <Text style={navS.label}>{tab.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}
const navS = StyleSheet.create({
  wrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row',
    backgroundColor: '#111d2e', paddingTop: 10, paddingBottom: 30,
    borderTopWidth: 1, borderColor: 'rgba(232,132,92,0.18)',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 20,
  },
  glow: { position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, backgroundColor: 'rgba(232,132,92,0.2)' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  discoverWrap: { shadowColor: '#e8845c', shadowOpacity: 0.5, shadowRadius: 10, elevation: 8, marginTop: -16 },
  discoverBtn: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#111d2e' },
  discoverIcon: { fontSize: 22, color: '#fff', fontWeight: '900' },
  discoverLabel: { color: '#e8845c', fontWeight: '800', marginTop: 2 },
  inactiveIcon: { fontSize: 20, color: 'rgba(245,240,235,0.28)' },
  label: { fontSize: 10, fontWeight: '600', color: 'rgba(245,240,235,0.35)' },
})

// ── Main Screen ───────────────────────────────────────────────
export default function ThreadsScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const router = useRouter()
  const [threads, setThreads] = useState<ThreadPost[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [composeVisible, setComposeVisible] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, user_id, content, image_url, location, like_count, comment_count, created_at')
        .eq('type', 'thread')
        .order('created_at', { ascending: false })
        .limit(60)

      if (error) throw error

      const uids = [...new Set((data ?? []).map(p => p.user_id))]
      let profilesMap: Record<string, { name: string; profile_image_url: string | null }> = {}
      if (uids.length > 0) {
        const { data: profs } = await supabase.from('profiles').select('id, name, profile_image_url').in('id', uids)
        for (const p of profs ?? []) profilesMap[p.id] = { name: p.name, profile_image_url: p.profile_image_url }
      }

      setThreads((data ?? []).map(p => ({
        ...p,
        author: profilesMap[p.user_id] ?? { name: '?', profile_image_url: null },
      })))
    } catch (e) {
      console.warn('Threads load error:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const handleDelete = async (id: string) => {
    Alert.alert('Thread löschen?', '', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: async () => {
        await supabase.from('posts').delete().eq('id', id)
        setThreads(prev => prev.filter(t => t.id !== id))
      }},
    ])
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={['#0d1b2e', '#1a3a5c']} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>✍️ Threads</Text>
        <Pressable onPress={() => setComposeVisible(true)} style={styles.newBtn}>
          <LinearGradient colors={gradients.brand} style={styles.newBtnGrad}>
            <Text style={styles.newBtnText}>+ Thread</Text>
          </LinearGradient>
        </Pressable>
      </LinearGradient>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)}
              tintColor={colors.primary} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>✍️</Text>
              <Text style={styles.emptyTitle}>Noch keine Threads</Text>
              <Text style={styles.emptySub}>Teile deine Gedanken zur Reise!</Text>
              <Pressable onPress={() => setComposeVisible(true)} style={{ borderRadius: 50, overflow: 'hidden', marginTop: 20 }}>
                <LinearGradient colors={gradients.brand} style={{ paddingHorizontal: 28, paddingVertical: 13 }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Thread schreiben</Text>
                </LinearGradient>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <ThreadCard
              post={item}
              currentUserId={userId}
              onDelete={() => handleDelete(item.id)}
            />
          )}
        />
      )}

      <ComposeModal
        visible={composeVisible}
        userId={userId}
        onClose={() => setComposeVisible(false)}
        onDone={() => load(true)}
      />

      <ThreadsTabBar />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 58, paddingBottom: 14, paddingHorizontal: spacing.lg,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backText: { fontSize: 28, color: colors.text, fontWeight: '300' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: colors.text },
  newBtn: { borderRadius: 20, overflow: 'hidden' },
  newBtnGrad: { paddingHorizontal: 14, paddingVertical: 8 },
  newBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  list: { padding: spacing.lg, gap: 12, paddingBottom: 120 },
  card: {
    backgroundColor: '#141f30', borderRadius: 18,
    padding: 16, borderWidth: 1, borderColor: 'rgba(232,132,92,0.2)',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  authorName: { fontSize: 15, fontWeight: '800', color: colors.text },
  metaRow: { flexDirection: 'row', marginTop: 2 },
  metaText: { fontSize: 11, color: colors.textMuted },
  deleteBtn: { padding: 8 },
  threadBody: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  accentBar: { width: 3, borderRadius: 2, backgroundColor: colors.primary },
  threadText: { fontSize: 17, color: colors.text, lineHeight: 26, marginBottom: 8 },
  threadImage: { width: '100%', height: 220, borderRadius: 14, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 20 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionIcon: { fontSize: 18, color: colors.textMuted },
  actionCount: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
})
