import StoriesBar from '@/src/components/StoriesBar'
import StoryViewer from '@/src/components/StoryViewer'
import HashtagText from '@/src/components/HashtagText'
import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { FeedPost, useFeed } from '@/src/hooks/useFeed'
import { useStories } from '@/src/hooks/useStories'
import { useNotifications, createNotification } from '@/src/hooks/useNotifications'
import { useFollow } from '@/src/hooks/useFollow'
import { useSaved } from '@/src/hooks/useSaved'
import { supabase } from '@/src/lib/supabase'
import * as FileSystem from 'expo-file-system/legacy'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { VideoView, useVideoPlayer } from 'expo-video'
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
      // Notify post owner
      const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single()
      if (post) createNotification({ userId: post.user_id, actorId: userId, type: 'comment', postId })
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

const CLAMP_MIN = 0.8   // 4:5 portrait
const CLAMP_MAX = 1.91  // 1.91:1 landscape
function clampRatio(r: number) { return Math.min(CLAMP_MAX, Math.max(CLAMP_MIN, r)) }

function FeedVideoPlayer({ uri, aspectRatio }: { uri: string; aspectRatio: number }) {
  const player = useVideoPlayer(uri, p => { p.loop = true; p.play() })
  return <VideoView player={player} style={{ width: '100%', aspectRatio }} contentFit="cover" nativeControls={false} />
}

function CarouselImages({ urls, aspectRatio }: { urls: string[]; aspectRatio: number }) {
  const [index, setIndex] = useState(0)
  return (
    <View style={{ position: 'relative' }}>
      <FlatList
        data={urls}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        onMomentumScrollEnd={e => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width)
          setIndex(i)
        }}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={{ width, aspectRatio }} resizeMode="cover" />
        )}
      />
      {/* Dot indicators */}
      <View style={carouselS.dots}>
        {urls.map((_, i) => (
          <View key={i} style={[carouselS.dot, i === index && carouselS.dotActive]} />
        ))}
      </View>
      {/* Counter */}
      <View style={carouselS.counter}>
        <Text style={carouselS.counterText}>{index + 1}/{urls.length}</Text>
      </View>
    </View>
  )
}

const carouselS = StyleSheet.create({
  dots: { position: 'absolute', bottom: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { backgroundColor: '#fff', width: 8 },
  counter: { position: 'absolute', top: 10, right: 12, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  counterText: { color: '#fff', fontSize: 12, fontWeight: '700' },
})

// ── Post card ─────────────────────────────────────────────────
function PostCard({ post, currentUserId, onLike, onRepost, onDelete, onComment, onEdit, onShareToStory, isSaved, onToggleSave, isFollowingAuthor, onFollow }: {
  post: FeedPost
  currentUserId: string
  onLike: () => void
  onRepost: () => void
  onDelete: () => void
  onComment: () => void
  onEdit?: () => void
  onShareToStory?: () => void
  isSaved?: boolean
  onToggleSave?: () => void
  isFollowingAuthor?: boolean
  onFollow?: () => void
}) {
  const likeAnim = useRef(new Animated.Value(1)).current
  const [showTags, setShowTags] = useState(false)
  const [imgRatio, setImgRatio] = useState<number | null>(null)

  const isRepostEarly = post.type === 'repost'
  const displayPostEarly = isRepostEarly && post.repost_origin ? post.repost_origin : post

  useEffect(() => {
    const p = displayPostEarly
    if ((p.media_urls?.length ?? 0) > 1 && p.media_urls![0]) {
      Image.getSize(p.media_urls![0], (w, h) => setImgRatio(clampRatio(w / h)), () => setImgRatio(1))
    } else if (p.image_url) {
      Image.getSize(p.image_url, (w, h) => setImgRatio(clampRatio(w / h)), () => setImgRatio(0.85))
    } else if (p.video_url) {
      setImgRatio(9 / 16)
    }
  }, [displayPostEarly.image_url, displayPostEarly.video_url, displayPostEarly.media_urls])

  const handleLike = () => {
    Animated.sequence([
      Animated.timing(likeAnim, { toValue: 1.4, duration: 90, useNativeDriver: true }),
      Animated.spring(likeAnim, { toValue: 1, useNativeDriver: true }),
    ]).start()
    onLike()
  }

  const handleRepost = () => {
    if (post.reposted_by_me) {
      Alert.alert('Bereits geteilt', 'Du hast diesen Beitrag bereits geteilt.')
      return
    }
    Alert.alert('Teilen', 'Diesen Beitrag in deinem Feed teilen?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Teilen ↗', onPress: onRepost },
    ])
  }

  const router = useRouter()
  const handleMore = () => {
    if (post.user_id === currentUserId) {
      Alert.alert('Beitrag', '', [
        { text: 'Bearbeiten', onPress: onEdit },
        { text: 'Insights anzeigen', onPress: () => router.push(`/post-insights/${post.id}` as any) },
        { text: 'Archivieren', onPress: async () => {
          await supabase.from('posts').update({ archived: true }).eq('id', post.id)
          onDelete()
        }},
        { text: 'Löschen', style: 'destructive', onPress: onDelete },
        { text: 'Abbrechen', style: 'cancel' },
      ])
    } else {
      const hasImage = !!(post.image_url || post.video_url)
      const followLabel = isFollowingAuthor ? 'Folgst du bereits' : 'Folgen'
      Alert.alert('Beitrag', '', [
        ...(!isFollowingAuthor && onFollow ? [{ text: `➕ ${followLabel}`, onPress: onFollow }] : []),
        { text: 'Im Feed teilen ↗', onPress: handleRepost },
        ...(hasImage && onShareToStory ? [{ text: 'In Story teilen 📸', onPress: onShareToStory }] : []),
        { text: 'Abbrechen', style: 'cancel' },
      ])
    }
  }

  const isRepost = isRepostEarly
  const displayPost = displayPostEarly
  const author = isRepost ? displayPost.author : post.author
  const isThread = !displayPost.image_url && !!displayPost.content
  const ratio = imgRatio ?? 0.85

  return (
    <View style={styles.card}>
      {/* Repost indicator */}
      {isRepost && (
        <View style={styles.repostBanner}>
          <Text style={styles.repostIcon}>↩</Text>
          <Text style={styles.repostBannerText}>{post.author?.name ?? 'Jemand'} hat geteilt</Text>
        </View>
      )}

      {/* ── Author row (Instagram style) ── */}
      <View style={styles.cardTop}>
        <Avatar uri={author?.profile_image_url} name={author?.name} size={38} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.authorName}>{author?.name ?? 'Unbekannt'}</Text>
          {displayPost.location
            ? <Text style={styles.metaText}>📍 {displayPost.location}</Text>
            : <Text style={styles.metaText}>{timeAgo(post.created_at)}</Text>
          }
        </View>
        <Pressable onPress={handleMore} style={styles.moreBtn}>
          <Text style={styles.moreBtnText}>•••</Text>
        </Pressable>
      </View>

      {/* ── Photo / Video (full width, Instagram style) ── */}
      {(displayPost.media_urls?.length ?? 0) > 1 ? (
        <CarouselImages urls={displayPost.media_urls!} aspectRatio={ratio} />
      ) : (displayPost.video_url || displayPost.image_url) ? (
        <View style={{ position: 'relative' }}>
          {displayPost.video_url ? (
            <FeedVideoPlayer uri={displayPost.video_url} aspectRatio={ratio} />
          ) : (
            <Image source={{ uri: displayPost.image_url! }} style={{ width: '100%', aspectRatio: ratio }} resizeMode="cover" />
          )}
          {/* Person icon when tags exist */}
          {displayPost.tags && displayPost.tags.length > 0 && (
            <Pressable style={styles.tagIconBtn} onPress={() => setShowTags(v => !v)}>
              <Text style={styles.tagIconText}>👤</Text>
            </Pressable>
          )}
          {/* Tag overlays */}
          {showTags && displayPost.tags?.map((tag, i) => (
            <View key={i} style={[styles.tagOverlay, {
              left: `${tag.x * 100}%` as any,
              top: `${tag.y * 100}%` as any,
            }]}>
              <Text style={styles.tagOverlayText}>@{tag.username}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* ── Actions row ── */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <Pressable style={styles.actionBtn} onPress={handleLike}>
            <Animated.Text style={[
              styles.actionIcon,
              { transform: [{ scale: likeAnim }] },
              post.liked_by_me && styles.actionIconLiked,
            ]}>
              {post.liked_by_me ? '♥' : '♡'}
            </Animated.Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={onComment}>
            <Text style={styles.actionIcon}>💬</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={handleRepost}>
            <Text style={[styles.actionIcon, post.reposted_by_me && styles.actionIconReposted]}>↗</Text>
          </Pressable>
        </View>
        {onToggleSave && (
          <Pressable style={styles.actionBtn} onPress={onToggleSave}>
            <Text style={[styles.actionIcon, isSaved && { color: colors.primary }]}>
              {isSaved ? '🔖' : '🔖'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* ── Likes count ── */}
      {post.like_count > 0 && (
        <Text style={styles.likesCount}>
          {post.like_count} {post.like_count === 1 ? 'Like' : 'Likes'}
        </Text>
      )}

      {/* ── Caption / thread text ── */}
      {displayPost.content ? (
        isThread ? (
          <View style={styles.threadBody}>
            <View style={styles.threadAccent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.captionAuthor}>{author?.name ?? ''} </Text>
              <HashtagText text={displayPost.content} style={styles.threadText} />
            </View>
          </View>
        ) : (
          <View style={styles.captionRow}>
            <Text style={styles.captionAuthor}>{author?.name ?? ''} </Text>
            <HashtagText text={displayPost.content} style={styles.captionText} />
          </View>
        )
      ) : null}

      {/* ── Comment count + time ── */}
      <View style={styles.cardFooter}>
        {post.comment_count > 0 && (
          <Pressable onPress={onComment}>
            <Text style={styles.commentCount}>Alle {post.comment_count} Kommentare ansehen</Text>
          </Pressable>
        )}
        <Text style={styles.timeText}>{timeAgo(post.created_at)}</Text>
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
  onClose: () => void; onCreate: (content: string, imageUrl: string | null, location: string | null, mediaUrls?: string[]) => Promise<void>
}) {
  const [text, setText] = useState('')
  const [location, setLocation] = useState('')
  const [imageUris, setImageUris] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Kein Zugriff', 'Bitte Fotogalerie-Zugriff erlauben.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 10, quality: 0.85,
    })
    if (!result.canceled) setImageUris(result.assets.map(a => a.uri))
  }

  const uploadImage = async (localUri: string): Promise<string> => {
    const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg'
    const filename = `feed/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
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
    if (!text.trim() && imageUris.length === 0) { Alert.alert('', 'Text oder Bild eingeben.'); return }
    setUploading(true)
    try {
      let imgUrl: string | null = null
      let mediaUrls: string[] | undefined
      if (imageUris.length === 1) {
        imgUrl = await uploadImage(imageUris[0])
      } else if (imageUris.length > 1) {
        const uploaded = await Promise.all(imageUris.map(uploadImage))
        imgUrl = uploaded[0]
        mediaUrls = uploaded
      }
      await onCreate(text.trim(), imgUrl, location.trim() || null, mediaUrls)
      setText(''); setLocation(''); setImageUris([])
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

            {imageUris.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {imageUris.map((uri, i) => (
                    <View key={i} style={{ position: 'relative' }}>
                      <Image source={{ uri }} style={{ width: 100, height: 100, borderRadius: 10 }} resizeMode="cover" />
                      <Pressable style={[styles.removeImageBtn, { width: 24, height: 24, top: 4, right: 4 }]}
                        onPress={() => setImageUris(prev => prev.filter((_, j) => j !== i))}>
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>✕</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </ScrollView>
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
            <Pressable style={styles.toolbarBtn} onPress={pickImages}>
              <Text style={styles.toolbarIcon}>🖼</Text>
              <Text style={styles.toolbarLabel}>Fotos {imageUris.length > 0 ? `(${imageUris.length})` : ''}</Text>
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
  const { posts, loading, refreshing, load, createPost, toggleLike, repost, deletePost, updatePost } = useFeed(userId)
  const { groups, seenIds, load: loadStories, addStory, markSeen, deleteStory } = useStories(userId)
  const { unreadCount } = useNotifications(userId)
  const { isSaved, toggleSave } = useSaved(userId)
  const { isFollowing, follow } = useFollow(userId)
  const router = useRouter()
  const [composeVisible, setComposeVisible] = useState(false)
  const [storyViewerVisible, setStoryViewerVisible] = useState(false)
  const [storyStartIndex, setStoryStartIndex] = useState(0)
  const [commentPostId, setCommentPostId] = useState<string | null>(null)
  const [editPost, setEditPost] = useState<{ id: string; content: string; location: string } | null>(null)
  const [feedTab, setFeedTab] = useState<'posts' | 'videos' | 'threads'>('posts')

  const [createSheetVisible, setCreateSheetVisible] = useState(false)
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

  const pickAndUploadStory = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Kein Zugriff', 'Bitte Fotogalerie-Zugriff erlauben.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [9, 16], quality: 0.85 })
    if (!result.canceled) await handleAddStory(result.assets[0].uri, null)
  }

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

  const handleShareToStory = async (post: any) => {
    Alert.alert('In Story teilen', `Beitrag von ${post.author?.name ?? '?'} als Story teilen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Teilen', onPress: async () => {
          try {
            const caption = `Beitrag von @${post.author?.name ?? 'jemand'}`
            await addStory(post.image_url, caption, 'image')
            Alert.alert('Geteilt!', 'Der Beitrag wurde als Story geteilt.')
          } catch (e: any) {
            Alert.alert('Fehler', e.message)
          }
        }
      },
    ])
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
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>✈ Travel Feed</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable style={styles.bellBtn} onPress={() => router.push('/notifications' as any)}>
            <Text style={styles.bellIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Feed filter tabs */}
      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterBtn, feedTab === 'posts' && styles.filterBtnActive]}
          onPress={() => setFeedTab('posts')}
        >
          <Text style={[styles.filterBtnText, feedTab === 'posts' && styles.filterBtnTextActive]}>Beiträge</Text>
        </Pressable>
        <Pressable
          style={[styles.filterBtn, feedTab === 'videos' && styles.filterBtnActive]}
          onPress={() => setFeedTab('videos')}
        >
          <Text style={[styles.filterBtnText, feedTab === 'videos' && styles.filterBtnTextActive]}>Videos</Text>
        </Pressable>
        <Pressable
          style={[styles.filterBtn, feedTab === 'threads' && styles.filterBtnActive]}
          onPress={() => setFeedTab('threads')}
        >
          <Text style={[styles.filterBtnText, feedTab === 'threads' && styles.filterBtnTextActive]}>Threads</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={posts.filter(p => {
            if (feedTab === 'posts') return !p.content || !!p.image_url || !!p.video_url || !!(p.media_urls?.length)
            if (feedTab === 'videos') return !!p.video_url
            if (feedTab === 'threads') return !!p.content && !p.image_url && !p.video_url && !(p.media_urls?.length)
            return true
          })}
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
              onDeleteStory={deleteStory}
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
              onEdit={() => setEditPost({ id: item.id, content: item.content ?? '', location: item.location ?? '' })}
              onShareToStory={item.image_url ? () => handleShareToStory(item) : undefined}
              isSaved={isSaved(item.id)}
              onToggleSave={() => toggleSave(item.id)}
              isFollowingAuthor={isFollowing(item.user_id)}
              onFollow={() => follow(item.user_id)}
            />
          )}
        />
      )}

      {/* Floating create button */}
      <Pressable style={styles.fab} onPress={() => setCreateSheetVisible(true)}>
        <LinearGradient colors={gradients.brand} style={styles.fabGrad}>
          <Text style={styles.fabText}>✎</Text>
        </LinearGradient>
      </Pressable>

      {/* Create type sheet */}
      <Modal visible={createSheetVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCreateSheetVisible(false)}>
        <View style={sheetS.root}>
          <View style={sheetS.handle} />
          <Text style={sheetS.title}>Was möchtest du teilen?</Text>
          <Pressable style={sheetS.option} onPress={() => { setCreateSheetVisible(false); setComposeVisible(true) }}>
            <LinearGradient colors={['#1a2a3e', '#243a52']} style={sheetS.optionGrad}>
              <Text style={sheetS.optionIcon}>📷</Text>
              <View style={sheetS.optionText}>
                <Text style={sheetS.optionTitle}>Beitrag</Text>
                <Text style={sheetS.optionSub}>Foto oder Text im Feed posten</Text>
              </View>
              <Text style={sheetS.optionArrow}>›</Text>
            </LinearGradient>
          </Pressable>
          <Pressable style={sheetS.option} onPress={() => { setCreateSheetVisible(false); router.push('/threads') }}>
            <LinearGradient colors={['#1a2a3e', '#243a52']} style={sheetS.optionGrad}>
              <Text style={sheetS.optionIcon}>✍️</Text>
              <View style={sheetS.optionText}>
                <Text style={sheetS.optionTitle}>Thread</Text>
                <Text style={sheetS.optionSub}>Gedanken & Erlebnisse teilen</Text>
              </View>
              <Text style={sheetS.optionArrow}>›</Text>
            </LinearGradient>
          </Pressable>
          <Pressable style={sheetS.option} onPress={() => { setCreateSheetVisible(false); pickAndUploadStory() }}>
            <LinearGradient colors={['#1a2a3e', '#243a52']} style={sheetS.optionGrad}>
              <Text style={sheetS.optionIcon}>📸</Text>
              <View style={sheetS.optionText}>
                <Text style={sheetS.optionTitle}>Story</Text>
                <Text style={sheetS.optionSub}>Verschwinde nach 24 Stunden</Text>
              </View>
              <Text style={sheetS.optionArrow}>›</Text>
            </LinearGradient>
          </Pressable>
          <Pressable style={sheetS.cancel} onPress={() => setCreateSheetVisible(false)}>
            <Text style={sheetS.cancelText}>Abbrechen</Text>
          </Pressable>
        </View>
      </Modal>

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
        onDelete={async (storyId) => { await deleteStory(storyId) }}
        userId={userId}
      />

      {/* Edit Post Modal */}
      {editPost && (
        <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditPost(null)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={styles.composeRoot}>
              <View style={styles.composeHeader}>
                <Pressable onPress={() => setEditPost(null)} style={styles.composeCancelBtn}>
                  <Text style={styles.composeCancelText}>Abbrechen</Text>
                </Pressable>
                <Text style={styles.composeTitle}>Beitrag bearbeiten</Text>
                <Pressable style={styles.composePostBtn} onPress={async () => {
                  try {
                    await updatePost(editPost.id, editPost.content, editPost.location || null)
                    setEditPost(null)
                  } catch (e: any) { Alert.alert('Fehler', e.message) }
                }}>
                  <LinearGradient colors={gradients.brand} style={styles.composePostBtnGrad}>
                    <Text style={styles.composePostText}>Speichern</Text>
                  </LinearGradient>
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={styles.composeBody}>
                <TextInput
                  style={styles.composeTextInput}
                  value={editPost.content}
                  onChangeText={t => setEditPost(p => p ? { ...p, content: t } : p)}
                  placeholder="Beschreibe deinen Beitrag…"
                  placeholderTextColor="rgba(245,240,235,0.3)"
                  multiline
                  maxLength={500}
                  autoFocus
                />
                <View style={styles.composeLocation}>
                  <Text style={{ fontSize: 16, marginRight: 8 }}>📍</Text>
                  <TextInput
                    style={styles.composeLocationInput}
                    value={editPost.location}
                    onChangeText={t => setEditPost(p => p ? { ...p, location: t } : p)}
                    placeholder="Ort (optional)"
                    placeholderTextColor="rgba(245,240,235,0.3)"
                  />
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

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

const sheetS = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1b2e', padding: 20 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(245,240,235,0.2)', alignSelf: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 20 },
  option: { borderRadius: 18, overflow: 'hidden', marginBottom: 12 },
  optionGrad: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14, borderWidth: 1, borderColor: 'rgba(232,132,92,0.15)', borderRadius: 18 },
  optionIcon: { fontSize: 32 },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 17, fontWeight: '900', color: colors.text },
  optionSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  optionArrow: { fontSize: 22, color: colors.textMuted },
  cancel: { marginTop: 8, padding: 16, alignItems: 'center' },
  cancelText: { fontSize: 16, color: colors.textMuted, fontWeight: '700' },
})

const styles = StyleSheet.create({
  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 58, paddingBottom: 12, paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderColor: 'rgba(245,240,235,0.08)',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backText: { fontSize: 28, color: '#fff', fontWeight: '300' },
  topBarTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  filterRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
  },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  filterBtnActive: {
    backgroundColor: 'rgba(232,132,92,0.18)',
    borderColor: colors.primary,
  },
  filterBtnText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  filterBtnTextActive: { color: colors.primary },
  bellBtn: { position: 'relative', width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  bellIcon: { fontSize: 22 },
  bellBadge: {
    position: 'absolute', top: 0, right: 0,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: colors.background,
  },
  bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  composeBtn: { borderRadius: 20, overflow: 'hidden' },
  composeBtnGrad: { paddingHorizontal: 14, paddingVertical: 7 },
  composeBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  // Feed — extra bottom padding so content clears the tab bar
  feed: { paddingVertical: 8, paddingBottom: 160 },

  // Post card — Instagram style (no margin, edge-to-edge, divider between posts)
  card: {
    backgroundColor: colors.surface,
    marginBottom: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  repostBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingTop: 10, paddingBottom: 2,
  },
  repostIcon: { fontSize: 12, color: colors.textMuted },
  repostBannerText: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
  cardTop: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  authorName: { fontSize: 14, fontWeight: '800', color: colors.text },
  metaText: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  moreBtn: { padding: 6 },
  moreBtnText: { fontSize: 14, color: colors.textMuted, letterSpacing: 1 },
  postImage: { width: '100%', aspectRatio: 0.85 },
  tagIconBtn: {
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  tagIconText: { fontSize: 15, color: '#fff' },
  tagOverlay: {
    position: 'absolute', transform: [{ translateX: -40 }, { translateY: -14 }],
    backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  tagOverlayText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  actions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  actionsLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionBtn: { padding: 2 },
  actionIcon: { fontSize: 26, color: colors.text },
  actionIconLiked: { color: '#ff3b30' },
  actionIconReposted: { color: colors.primary },
  actionCount: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  likesCount: {
    fontSize: 13, fontWeight: '800', color: colors.text,
    paddingHorizontal: spacing.md, marginBottom: 4,
  },
  captionRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.md, marginBottom: 4,
  },
  captionAuthor: { fontSize: 13, fontWeight: '800', color: colors.text },
  captionText: { fontSize: 13, color: colors.text, lineHeight: 19 },
  threadBody: {
    flexDirection: 'row', paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: 10, marginBottom: 4,
  },
  threadAccent: {
    width: 3, borderRadius: 2, backgroundColor: colors.primary,
    alignSelf: 'stretch', opacity: 0.7,
  },
  threadText: {
    flex: 1, fontSize: 15, color: colors.text, lineHeight: 23, fontWeight: '400',
  },
  cardFooter: {
    paddingHorizontal: spacing.md, paddingBottom: 12, gap: 3,
  },
  commentCount: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  timeText: { fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },

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
