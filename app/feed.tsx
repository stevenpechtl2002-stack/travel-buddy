import StoriesBar from '@/src/components/StoriesBar'
import StoryViewer from '@/src/components/StoryViewer'
import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { FeedPost, useFeed } from '@/src/hooks/useFeed'
import { useStories } from '@/src/hooks/useStories'
import { supabase } from '@/src/lib/supabase'
import * as FileSystem from 'expo-file-system/legacy'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import {
  ActionSheetIOS, ActivityIndicator, Alert, Animated, Dimensions,
  FlatList, Image, KeyboardAvoidingView, Modal, Platform,
  Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native'

const { width } = Dimensions.get('window')
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''

// ── Time helper ──────────────────────────────────────────────
function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'gerade eben'
  if (secs < 3600) return `vor ${Math.floor(secs / 60)} Min`
  if (secs < 86400) return `vor ${Math.floor(secs / 3600)} Std`
  return `vor ${Math.floor(secs / 86400)} Tagen`
}

// ── Avatar ───────────────────────────────────────────────────
function Avatar({ uri, size = 40, name = '?' }: { uri?: string | null; size?: number; name?: string }) {
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  return (
    <LinearGradient colors={gradients.brand} style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '900', fontSize: size * 0.4 }}>{name.charAt(0).toUpperCase()}</Text>
    </LinearGradient>
  )
}

// ── Comment Sheet ─────────────────────────────────────────────
function CommentSheet({ postId, userId, myProfile, visible, onClose, onCommentAdded }: {
  postId: string; userId: string
  myProfile: { name: string; profile_image_url: string | null }
  visible: boolean; onClose: () => void; onCommentAdded: () => void
}) {
  const [comments, setComments] = useState<any[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!visible || !postId) return
    supabase.from('post_comments')
      .select('id, content, created_at, user_id, author:profiles!post_comments_user_id_fkey(name, profile_image_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .then(async ({ data, error }) => {
        if (error || !data) {
          // fallback: fetch profiles separately
          const { data: raw } = await supabase.from('post_comments')
            .select('id, content, created_at, user_id')
            .eq('post_id', postId)
            .order('created_at', { ascending: true })
          if (!raw) return
          const uids = [...new Set(raw.map(c => c.user_id))]
          const { data: profs } = await supabase.from('profiles').select('id, name, profile_image_url').in('id', uids)
          const pm: Record<string, any> = {}
          for (const p of profs ?? []) pm[p.id] = p
          setComments(raw.map(c => ({ ...c, author: pm[c.user_id] ?? { name: '?', profile_image_url: null } })))
        } else {
          setComments(data.map(c => ({ ...c, author: Array.isArray(c.author) ? c.author[0] : c.author })))
        }
      })
  }, [visible, postId])

  const send = async () => {
    if (!text.trim()) return
    setSending(true)
    const { error } = await supabase.from('post_comments').insert({ post_id: postId, user_id: userId, content: text.trim() })
    if (!error) {
      await supabase.from('posts').update({ comment_count: (comments.length + 1) }).eq('id', postId)
      setComments(prev => [...prev, { id: Date.now().toString(), content: text.trim(), created_at: new Date().toISOString(), user_id: userId, author: myProfile }])
      setText('')
      onCommentAdded()
    }
    setSending(false)
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={cmtS.root}>
          <View style={cmtS.handle} />
          <View style={cmtS.header}>
            <Text style={cmtS.title}>Kommentare</Text>
            <Pressable onPress={onClose}><Text style={cmtS.close}>✕</Text></Pressable>
          </View>
          <FlatList
            data={comments}
            keyExtractor={c => c.id}
            contentContainerStyle={cmtS.list}
            ListEmptyComponent={<Text style={cmtS.empty}>Noch keine Kommentare. Sei der Erste!</Text>}
            renderItem={({ item }) => (
              <View style={cmtS.row}>
                <Avatar uri={item.author?.profile_image_url} name={item.author?.name ?? '?'} size={36} />
                <View style={cmtS.bubble}>
                  <Text style={cmtS.name}>{item.author?.name ?? 'Unbekannt'}</Text>
                  <Text style={cmtS.text}>{item.content}</Text>
                </View>
              </View>
            )}
          />
          <View style={cmtS.inputRow}>
            <Avatar uri={myProfile.profile_image_url} name={myProfile.name} size={32} />
            <TextInput
              style={cmtS.input}
              value={text}
              onChangeText={setText}
              placeholder="Kommentar schreiben…"
              placeholderTextColor="rgba(245,240,235,0.3)"
              multiline
            />
            <Pressable onPress={send} disabled={sending || !text.trim()} style={cmtS.sendBtn}>
              <LinearGradient colors={gradients.brand} style={cmtS.sendGrad}>
                <Text style={cmtS.sendIcon}>{sending ? '…' : '↑'}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
const cmtS = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1b2e' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(245,240,235,0.2)', alignSelf: 'center', marginTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: 'rgba(245,240,235,0.08)' },
  title: { fontSize: 17, fontWeight: '900', color: colors.text },
  close: { fontSize: 18, color: colors.textMuted, paddingHorizontal: 8 },
  list: { padding: 16, gap: 14, paddingBottom: 8 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 14 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bubble: { flex: 1, backgroundColor: 'rgba(245,240,235,0.07)', borderRadius: 14, padding: 10 },
  name: { fontSize: 12, fontWeight: '800', color: colors.primary, marginBottom: 3 },
  text: { fontSize: 14, color: colors.text, lineHeight: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, borderColor: 'rgba(245,240,235,0.08)' },
  input: { flex: 1, backgroundColor: 'rgba(245,240,235,0.08)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, color: colors.text, fontSize: 14, maxHeight: 100 },
  sendBtn: { borderRadius: 18, overflow: 'hidden' },
  sendGrad: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  sendIcon: { color: '#fff', fontSize: 16, fontWeight: '900' },
})

// ── Post card ─────────────────────────────────────────────────
function PostCard({ post, currentUserId, onLike, onRepost, onDelete, onComment }: {
  post: FeedPost
  currentUserId: string
  onLike: () => void
  onRepost: () => void
  onDelete: () => void
  onComment: () => void
}) {
  const likeAnim = useRef(new Animated.Value(1)).current

  const handleLike = () => {
    Animated.sequence([
      Animated.timing(likeAnim, { toValue: 1.35, duration: 100, useNativeDriver: true }),
      Animated.spring(likeAnim, { toValue: 1, useNativeDriver: true }),
    ]).start()
    onLike()
  }

  const isRepost = post.type === 'repost'
  const displayPost = isRepost && post.repost_origin ? post.repost_origin : post
  const author = post.author
  const isThread = !displayPost.image_url && !!displayPost.content

  return (
    <View style={[styles.card, isThread && styles.threadCard]}>
      {isRepost && (
        <View style={styles.repostBanner}>
          <Text style={styles.repostBannerText}>↩ {author?.name ?? 'Jemand'} hat geteilt</Text>
        </View>
      )}

      {/* Thread badge */}
      {isThread && !isRepost && (
        <View style={styles.threadBadge}>
          <Text style={styles.threadBadgeText}>✍️ Thread</Text>
        </View>
      )}

      <View style={styles.cardTop}>
        <Avatar uri={isRepost ? displayPost.author?.profile_image_url : author?.profile_image_url}
          name={isRepost ? displayPost.author?.name : author?.name} size={42} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.authorName}>
            {isRepost ? displayPost.author?.name ?? 'Unbekannt' : author?.name ?? 'Unbekannt'}
          </Text>
          <View style={styles.metaRow}>
            {displayPost.location ? <Text style={styles.metaText}>📍 {displayPost.location} · </Text> : null}
            <Text style={styles.metaText}>{timeAgo(post.created_at)}</Text>
          </View>
        </View>
        {post.user_id === currentUserId && (
          <Pressable onPress={onDelete} style={styles.deleteBtn}>
            <Text style={{ color: colors.textMuted, fontSize: 18 }}>···</Text>
          </Pressable>
        )}
      </View>

      {/* Thread: big readable text with left accent bar */}
      {isThread ? (
        <View style={styles.threadBody}>
          <View style={styles.threadAccent} />
          <Text style={styles.threadText}>{displayPost.content}</Text>
        </View>
      ) : displayPost.content ? (
        <Text style={styles.content}>{displayPost.content}</Text>
      ) : null}

      {displayPost.image_url ? (
        <Image source={{ uri: displayPost.image_url }} style={styles.postImage} resizeMode="cover" />
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={handleLike}>
          <Animated.Text style={[styles.actionIcon, { transform: [{ scale: likeAnim }] },
            post.liked_by_me && { color: '#e05555' }]}>
            {post.liked_by_me ? '♥' : '♡'}
          </Animated.Text>
          <Text style={[styles.actionCount, post.liked_by_me && { color: '#e05555' }]}>
            {post.like_count > 0 ? post.like_count : ''}
          </Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={onRepost}>
          <Text style={[styles.actionIcon, post.reposted_by_me && { color: colors.primary }]}>↩</Text>
          <Text style={[styles.actionCount, post.reposted_by_me && { color: colors.primary }]}>
            {post.repost_count > 0 ? post.repost_count : ''}
          </Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={onComment}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{post.comment_count > 0 ? post.comment_count : ''}</Text>
        </Pressable>
      </View>
    </View>
  )
}

// ── Feed Tab Bar ──────────────────────────────────────────────
function FeedTabBar({ active }: { active: 'home' | 'chat' | 'discover' | 'search' | 'profile' }) {
  const router = useRouter()
  const tabs = [
    { key: 'home',     icon: '⌂',  label: 'Home',      route: '/feed',              center: false },
    { key: 'chat',     icon: '💬', label: 'Chat',      route: '/chats',             center: false },
    { key: 'discover', icon: '✦',  label: 'Entdecken', route: '/(tabs)/discover',   center: true  },
    { key: 'search',   icon: '⊙',  label: 'Suchen',    route: '/explore',           center: false },
    { key: 'profile',  icon: '◯',  label: 'Profil',    route: '/feed-profile',      center: false },
  ] as const

  return (
    <View style={navStyles.wrapper}>
      <View style={navStyles.glow} />
      {tabs.map(tab => {
        const focused = active === tab.key
        if (tab.center) {
          return (
            <Pressable key={tab.key} style={navStyles.tab}
              onPress={() => router.push(tab.route as any)}>
              <View style={navStyles.discoverWrap}>
                <LinearGradient colors={gradients.brand} style={navStyles.discoverBtn}>
                  <Text style={navStyles.discoverIcon}>{tab.icon}</Text>
                </LinearGradient>
              </View>
              <Text style={[navStyles.label, navStyles.discoverLabel]}>{tab.label}</Text>
            </Pressable>
          )
        }
        return (
          <Pressable
            key={tab.key}
            style={navStyles.tab}
            onPress={() => router.push(tab.route as any)}
          >
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
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    backgroundColor: '#111d2e',
    paddingTop: 10, paddingBottom: 30,
    borderTopWidth: 1, borderColor: 'rgba(232,132,92,0.18)',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 20,
  },
  glow: {
    position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
    backgroundColor: 'rgba(232,132,92,0.2)',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  // Center Entdecken button
  discoverWrap: {
    shadowColor: '#e8845c', shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
    marginTop: -16,
  },
  discoverBtn: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#111d2e',
  },
  discoverIcon: { fontSize: 22, color: '#fff', fontWeight: '900' },
  discoverLabel: { color: colors.primary, fontWeight: '800', marginTop: 2 },
  pill: {
    width: 44, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  activeIcon: { fontSize: 20, color: '#fff', fontWeight: '700' },
  inactiveIcon: { fontSize: 20, color: 'rgba(245,240,235,0.28)' },
  label: { fontSize: 10, fontWeight: '600', color: 'rgba(245,240,235,0.35)' },
  labelActive: { color: '#e8845c', fontWeight: '800' },
})

// ── Compose Modal ─────────────────────────────────────────────
function ComposeModal({ visible, userId, onClose, onCreate }: {
  visible: boolean; userId: string
  onClose: () => void; onCreate: (content: string, imageUrl: string | null, location: string | null) => Promise<void>
}) {
  const [text, setText] = useState('')
  const [location, setLocation] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Kein Zugriff', 'Bitte Fotogalerie-Zugriff erlauben.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.85,
    })
    if (!result.canceled) setImageUri(result.assets[0].uri)
  }

  const uploadImage = async (localUri: string): Promise<string> => {
    const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg'
    const filename = `feed/${userId}/${Date.now()}.${ext}`
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) throw new Error('Nicht eingeloggt')
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/profile-images/${filename}`
    const result = await FileSystem.uploadAsync(uploadUrl, localUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
    })
    if (result.status < 200 || result.status >= 300) throw new Error(`Upload ${result.status}`)
    const { data } = supabase.storage.from('profile-images').getPublicUrl(filename)
    return data.publicUrl
  }

  const handlePost = async () => {
    if (!text.trim() && !imageUri) { Alert.alert('', 'Text oder Bild eingeben.'); return }
    setUploading(true)
    try {
      let imgUrl: string | null = null
      if (imageUri) imgUrl = await uploadImage(imageUri)
      await onCreate(text.trim(), imgUrl, location.trim() || null)
      setText(''); setLocation(''); setImageUri(null)
      onClose()
    } catch (e: any) {
      Alert.alert('Fehler', e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.composeRoot}>
        <View style={styles.composeHeader}>
          <Pressable onPress={onClose} style={styles.composeCancelBtn}>
            <Text style={styles.composeCancelText}>Abbrechen</Text>
          </Pressable>
          <Text style={styles.composeTitle}>Neuer Post</Text>
          <Pressable style={[styles.composePostBtn, uploading && { opacity: 0.5 }]} onPress={handlePost} disabled={uploading}>
            <LinearGradient colors={gradients.brand} style={styles.composePostBtnGrad}>
              {uploading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.composePostText}>Posten</Text>}
            </LinearGradient>
          </Pressable>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.composeBody} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.composeTextInput}
              value={text}
              onChangeText={setText}
              placeholder="Was erlebst du gerade? ✈️"
              placeholderTextColor="rgba(245,240,235,0.3)"
              multiline
              maxLength={500}
              autoFocus
            />

            {imageUri && (
              <View style={{ position: 'relative', marginBottom: 12 }}>
                <Image source={{ uri: imageUri }} style={styles.composeImagePreview} resizeMode="cover" />
                <Pressable style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>✕</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.composeLocation}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>📍</Text>
              <TextInput
                style={styles.composeLocationInput}
                value={location}
                onChangeText={setLocation}
                placeholder="Ort hinzufügen (optional)"
                placeholderTextColor="rgba(245,240,235,0.3)"
              />
            </View>
          </ScrollView>

          <View style={styles.composeToolbar}>
            <Pressable style={styles.toolbarBtn} onPress={pickImage}>
              <Text style={styles.toolbarIcon}>🖼</Text>
              <Text style={styles.toolbarLabel}>Foto</Text>
            </Pressable>
            <Text style={styles.charCount}>{text.length}/500</Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

// ── Main Feed Screen ──────────────────────────────────────────
export default function FeedScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const { posts, loading, refreshing, load, createPost, toggleLike, repost, deletePost } = useFeed(userId)
  const { groups, seenIds, load: loadStories, addStory, markSeen } = useStories(userId)
  const router = useRouter()
  const [composeVisible, setComposeVisible] = useState(false)
  const [storyViewerVisible, setStoryViewerVisible] = useState(false)
  const [storyStartIndex, setStoryStartIndex] = useState(0)
  const [commentPostId, setCommentPostId] = useState<string | null>(null)
  const [myProfile, setMyProfile] = useState<{ name: string; profile_image_url: string | null }>({
    name: '?', profile_image_url: null,
  })

  useEffect(() => {
    if (!userId) return
    supabase.from('profiles').select('name, profile_image_url').eq('id', userId).single()
      .then(({ data }) => { if (data) setMyProfile(data) })
  }, [userId])

  useFocusEffect(useCallback(() => {
    if (userId) load(true)
  }, [userId, load]))

  const handleAddStory = async (localUri: string, caption: string | null) => {
    const ext = localUri.split('?')[0].split('.').pop()?.toLowerCase() ?? 'jpg'
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg'
    const filename = `stories/${userId}/${Date.now()}.${ext}`
    const { data: { session: s } } = await supabase.auth.getSession()
    const token = s?.access_token
    if (!token) throw new Error('Nicht eingeloggt')
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/profile-images/${filename}`
    const result = await FileSystem.uploadAsync(uploadUrl, localUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': mime, 'x-upsert': 'true' },
    })
    if (result.status < 200 || result.status >= 300) throw new Error(`Upload ${result.status}`)
    const { data: pub } = supabase.storage.from('profile-images').getPublicUrl(filename)
    await addStory(pub.publicUrl, caption)
  }

  const openStory = (groupIndex: number) => {
    setStoryStartIndex(groupIndex)
    setStoryViewerVisible(true)
  }

  const handleDelete = (postId: string) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Post löschen', 'Abbrechen'], destructiveButtonIndex: 0, cancelButtonIndex: 1 },
        idx => { if (idx === 0) deletePost(postId) }
      )
    } else {
      Alert.alert('Post löschen?', '', [
        { text: 'Löschen', style: 'destructive', onPress: () => deletePost(postId) },
        { text: 'Abbrechen', style: 'cancel' },
      ])
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Gradient top bar */}
      <LinearGradient colors={['#0d1b2e', '#1a3a5c']} style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>Travel Feed</Text>
        <Pressable style={styles.composeBtn} onPress={() => setComposeVisible(true)}>
          <LinearGradient colors={gradients.brand} style={styles.composeBtnGrad}>
            <Text style={styles.composeBtnText}>+ Post</Text>
          </LinearGradient>
        </Pressable>
      </LinearGradient>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.feed}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { load(true); loadStories() }}
              tintColor={colors.primary} colors={[colors.primary]} />
          }
          ListHeaderComponent={
            <StoriesBar
              groups={groups}
              myUserId={userId}
              myName={myProfile.name}
              myPhotoUrl={myProfile.profile_image_url}
              seenIds={seenIds}
              onOpenStory={openStory}
              onAddStory={handleAddStory}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>✈️</Text>
              <Text style={styles.emptyTitle}>Noch keine Posts</Text>
              <Text style={styles.emptySub}>Sei der Erste und teile dein Abenteuer!</Text>
              <Pressable style={styles.emptyBtn} onPress={() => setComposeVisible(true)}>
                <LinearGradient colors={gradients.brand} style={styles.emptyBtnGrad}>
                  <Text style={styles.emptyBtnText}>Post erstellen</Text>
                </LinearGradient>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUserId={userId}
              onLike={() => toggleLike(item.id)}
              onRepost={() => repost(item.id)}
              onDelete={() => handleDelete(item.id)}
              onComment={() => setCommentPostId(item.id)}
            />
          )}
        />
      )}

      {/* Floating compose button */}
      <Pressable style={styles.fab} onPress={() => setComposeVisible(true)}>
        <LinearGradient colors={gradients.brand} style={styles.fabGrad}>
          <Text style={styles.fabText}>✎</Text>
        </LinearGradient>
      </Pressable>

      <ComposeModal
        visible={composeVisible}
        userId={userId}
        onClose={() => setComposeVisible(false)}
        onCreate={createPost}
      />

      <StoryViewer
        groups={groups}
        startGroupIndex={storyStartIndex}
        visible={storyViewerVisible}
        onClose={() => setStoryViewerVisible(false)}
        onSeen={markSeen}
      />

      {/* Comment Sheet */}
      {commentPostId && (
        <CommentSheet
          postId={commentPostId}
          userId={userId}
          myProfile={myProfile}
          visible={!!commentPostId}
          onClose={() => setCommentPostId(null)}
          onCommentAdded={() => load(true)}
        />
      )}

      {/* Bottom nav */}
      <FeedTabBar active="home" />
    </View>
  )
}

const styles = StyleSheet.create({
  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 58, paddingBottom: 14, paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderColor: 'rgba(245,240,235,0.08)',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backText: { fontSize: 28, color: '#fff', fontWeight: '300' },
  topBarTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  composeBtn: { borderRadius: 20, overflow: 'hidden' },
  composeBtnGrad: { paddingHorizontal: 14, paddingVertical: 7 },
  composeBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  // Feed — extra bottom padding so content clears the tab bar
  feed: { paddingVertical: 8, paddingBottom: 160 },

  // Post card
  card: {
    backgroundColor: colors.surface, marginHorizontal: spacing.md, marginBottom: 12,
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  // Thread card — slightly different background
  threadCard: {
    backgroundColor: '#141f30',
    borderColor: 'rgba(232,132,92,0.15)',
  },
  threadBadge: {
    alignSelf: 'flex-start', marginHorizontal: spacing.md, marginTop: 10,
    backgroundColor: 'rgba(232,132,92,0.12)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(232,132,92,0.25)',
  },
  threadBadgeText: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 0.3 },
  threadBody: {
    flexDirection: 'row', paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: 10,
  },
  threadAccent: {
    width: 3, borderRadius: 2, backgroundColor: colors.primary,
    alignSelf: 'stretch', opacity: 0.7,
  },
  threadText: {
    flex: 1, fontSize: 17, color: colors.text, lineHeight: 26, fontWeight: '500',
  },
  repostBanner: {
    backgroundColor: 'rgba(232,132,92,0.1)', paddingHorizontal: spacing.md, paddingVertical: 6,
    borderBottomWidth: 1, borderColor: 'rgba(232,132,92,0.15)',
  },
  repostBannerText: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  cardTop: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  authorName: { fontSize: 15, fontWeight: '800', color: colors.text },
  metaRow: { flexDirection: 'row', marginTop: 2 },
  metaText: { fontSize: 12, color: colors.textMuted },
  deleteBtn: { padding: 4 },
  content: {
    fontSize: 15, color: colors.text, lineHeight: 22,
    paddingHorizontal: spacing.md, paddingBottom: spacing.md,
  },
  postImage: { width: '100%', height: width * 0.65 },
  actions: {
    flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: 12,
    borderTopWidth: 1, borderColor: colors.border, gap: 24,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionIcon: { fontSize: 20, color: colors.textMuted },
  actionCount: { fontSize: 13, fontWeight: '700', color: colors.textMuted },

  // Empty state
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 24 },
  emptyBtn: { borderRadius: 50, overflow: 'hidden' },
  emptyBtnGrad: { paddingHorizontal: 28, paddingVertical: 13 },
  emptyBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },

  // FAB — sits above the tab bar (tab bar height ~90)
  fab: { position: 'absolute', bottom: 100, right: 24, borderRadius: 28, overflow: 'hidden',
    shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  fabGrad: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },
  fabText: { fontSize: 24, color: '#fff' },

  // Compose modal
  composeRoot: { flex: 1, backgroundColor: colors.background },
  composeHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderColor: colors.border,
  },
  composeTitle: { fontSize: 16, fontWeight: '900', color: colors.text },
  composeCancelBtn: { padding: 4 },
  composeCancelText: { fontSize: 15, color: colors.textMuted, fontWeight: '600' },
  composePostBtn: { borderRadius: 20, overflow: 'hidden' },
  composePostBtnGrad: { paddingHorizontal: 16, paddingVertical: 8 },
  composePostText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  composeBody: { padding: spacing.lg, flexGrow: 1 },
  composeTextInput: {
    fontSize: 17, color: colors.text, lineHeight: 25,
    minHeight: 120, textAlignVertical: 'top', marginBottom: 16,
  },
  composeImagePreview: { width: '100%', height: 220, borderRadius: 14, marginBottom: 12 },
  removeImageBtn: {
    position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
  },
  composeLocation: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  composeLocationInput: { flex: 1, fontSize: 14, color: colors.text },
  composeToolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: 12,
    borderTopWidth: 1, borderColor: colors.border,
  },
  toolbarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toolbarIcon: { fontSize: 22 },
  toolbarLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  charCount: { fontSize: 12, color: colors.textMuted },
})
