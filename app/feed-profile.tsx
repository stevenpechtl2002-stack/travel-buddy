import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { FeedPost } from '@/src/hooks/useFeed'
import { useStories } from '@/src/hooks/useStories'
import { useSaved } from '@/src/hooks/useSaved'
import { useHighlights } from '@/src/hooks/useHighlights'
import { createNotification } from '@/src/hooks/useNotifications'
import { supabase } from '@/src/lib/supabase'
import StoryViewer from '@/src/components/StoryViewer'
import * as FileSystem from 'expo-file-system/legacy'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { VideoView, useVideoPlayer } from 'expo-video'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  ActionSheetIOS, ActivityIndicator, Alert, Animated,
  Dimensions, FlatList, Image, KeyboardAvoidingView, Modal,
  Platform, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native'

const { width, height: screenHeight } = Dimensions.get('window')
const GRID_CELL = (width - 3) / 3
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''

interface OwnPost extends FeedPost {}

interface ProfileStats {
  postCount: number
  followerCount: number
  followingCount: number
}

interface ProfileData {
  name: string
  bio: string | null
  profile_image_url: string | null
  country: string | null
  // Feed-specific fields (independent from swipe profile)
  feed_name: string | null
  feed_bio: string | null
  feed_avatar_url: string | null
}

// ── Bottom nav ────────────────────────────────────────────────
function FeedProfileTabBar() {
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
        const active = tab.key === 'profile'
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
            {active
              ? <LinearGradient colors={gradients.brand} style={navS.pill}><Text style={navS.activeIcon}>{tab.icon}</Text></LinearGradient>
              : <Text style={navS.inactiveIcon}>{tab.icon}</Text>}
            <Text style={[navS.label, active && navS.labelActive]}>{tab.label}</Text>
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
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 20,
  },
  glow: { position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, backgroundColor: 'rgba(232,132,92,0.2)' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  discoverWrap: { shadowColor: '#e8845c', shadowOpacity: 0.5, shadowRadius: 10, elevation: 8, marginTop: -16 },
  discoverBtn: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#111d2e' },
  discoverIcon: { fontSize: 22, color: '#fff', fontWeight: '900' },
  discoverLabel: { color: '#e8845c', fontWeight: '800', marginTop: 2 },
  pill: { width: 44, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  activeIcon: { fontSize: 20, color: '#fff', fontWeight: '700' },
  inactiveIcon: { fontSize: 20, color: 'rgba(245,240,235,0.28)' },
  label: { fontSize: 10, fontWeight: '600', color: 'rgba(245,240,235,0.35)' },
  labelActive: { color: '#e8845c', fontWeight: '800' },
})

// ── Compose modal ─────────────────────────────────────────────
function ComposeModal({ visible, userId, type, onClose, onDone }: {
  visible: boolean; userId: string; type: 'post' | 'thread'
  onClose: () => void; onDone: (navigateToFeed?: boolean) => void
}) {
  const [text, setText] = useState('')
  const [location, setLocation] = useState('')
  const [mediaUri, setMediaUri] = useState<string | null>(null)
  const [mediaIsVideo, setMediaIsVideo] = useState(false)
  const [posting, setPosting] = useState(false)
  const [tags, setTags] = useState<Array<{username: string, x: number, y: number}>>([])
  const [tagMode, setTagMode] = useState(false)
  const [pendingPos, setPendingPos] = useState<{x: number, y: number} | null>(null)
  const [showTagSearch, setShowTagSearch] = useState(false)
  const [tagSearch, setTagSearch] = useState('')
  const [tagResults, setTagResults] = useState<Array<{id: string, name: string}>>([])
  const [imgContainerSize, setImgContainerSize] = useState({ w: 0, h: 0 })

  const reset = () => {
    setText(''); setLocation(''); setMediaUri(null); setMediaIsVideo(false)
    setTags([]); setTagMode(false)
  }

  const searchUsers = async (q: string) => {
    setTagSearch(q)
    if (q.length < 1) { setTagResults([]); return }
    const { data } = await supabase.from('profiles').select('id, name').ilike('name', `%${q}%`).limit(8)
    setTagResults(data ?? [])
  }

  const confirmTag = (username: string) => {
    if (pendingPos) setTags(prev => [...prev, { username, x: pendingPos.x, y: pendingPos.y }])
    setShowTagSearch(false); setTagSearch(''); setTagResults([]); setPendingPos(null)
  }

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.85,
      videoMaxDuration: 60,
    })
    if (!res.canceled) {
      const asset = res.assets[0]
      setMediaUri(asset.uri)
      setMediaIsVideo(asset.type === 'video')
    }
  }

  const uploadMedia = async (uri: string, isVideo: boolean): Promise<string> => {
    const ext = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? (isVideo ? 'mp4' : 'jpg')
    const mime = isVideo ? 'video/mp4' : 'image/jpeg'
    const fname = `feed/${userId}/${Date.now()}.${ext}`
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) throw new Error('Nicht eingeloggt')
    const res = await FileSystem.uploadAsync(
      `${SUPABASE_URL}/storage/v1/object/profile-images/${fname}`, uri,
      { httpMethod: 'POST', uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': mime, 'x-upsert': 'true' } }
    )
    if (res.status < 200 || res.status >= 300) throw new Error(`Upload ${res.status}`)
    return supabase.storage.from('profile-images').getPublicUrl(fname).data.publicUrl
  }

  const handlePost = async () => {
    if (!text.trim() && !mediaUri) { Alert.alert('', 'Text, Bild oder Video eingeben'); return }
    setPosting(true)
    try {
      let imgUrl: string | null = null
      let vidUrl: string | null = null
      if (mediaUri) {
        const url = await uploadMedia(mediaUri, mediaIsVideo)
        if (mediaIsVideo) vidUrl = url
        else imgUrl = url
      }
      const { error: insertError } = await supabase.from('posts').insert({
        user_id: userId,
        content: text.trim() || null,
        image_url: imgUrl,
        video_url: vidUrl,
        location: location.trim() || null,
        type: 'post',
        like_count: 0, repost_count: 0, comment_count: 0,
        tags: tags.length > 0 ? tags : null,
      })
      if (insertError) throw new Error(insertError.message)
      // Tag notifications
      if (tags.length > 0) {
        const taggedUsernames = tags.map(t => t.username)
        const { data: taggedProfiles } = await supabase
          .from('profiles').select('id, username').in('username', taggedUsernames)
        for (const p of taggedProfiles ?? []) {
          createNotification({ userId: p.id, actorId: userId, type: 'tag' })
        }
      }
      reset(); onClose(); onDone(type === 'thread')
    } catch (e: any) {
      Alert.alert('Fehler', e.message)
    } finally {
      setPosting(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={cs.root}>
        <View style={cs.header}>
          <Pressable onPress={() => { reset(); onClose() }}><Text style={cs.cancel}>Abbrechen</Text></Pressable>
          <Text style={cs.title}>{type === 'thread' ? 'Neuer Thread' : 'Neuer Post'}</Text>
          <Pressable onPress={handlePost} disabled={posting} style={[cs.postBtn, posting && { opacity: 0.5 }]}>
            <LinearGradient colors={gradients.brand} style={cs.postBtnGrad}>
              {posting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={cs.postBtnText}>Posten</Text>}
            </LinearGradient>
          </Pressable>
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={cs.body} keyboardShouldPersistTaps="handled">
            <TextInput
              style={cs.textInput}
              value={text}
              onChangeText={setText}
              placeholder={type === 'thread' ? 'Was denkst du? 💭' : 'Was erlebst du gerade? ✈️'}
              placeholderTextColor="rgba(245,240,235,0.3)"
              multiline maxLength={500} autoFocus
            />
            {type !== 'thread' && (
              mediaUri ? (
                <View
                  style={{ position: 'relative', marginBottom: 12 }}
                  onLayout={e => setImgContainerSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
                >
                  <Pressable
                    onPress={tagMode ? (e) => {
                      if (imgContainerSize.w === 0) return
                      const x = e.nativeEvent.locationX / imgContainerSize.w
                      const y = e.nativeEvent.locationY / imgContainerSize.h
                      setPendingPos({ x, y })
                      setShowTagSearch(true)
                    } : undefined}
                  >
                    {mediaIsVideo ? (
                      <View style={[cs.imgPreview, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ fontSize: 48 }}>▶</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8 }}>Video ausgewählt</Text>
                      </View>
                    ) : (
                      <Image source={{ uri: mediaUri }} style={cs.imgPreview} resizeMode="cover" />
                    )}
                  </Pressable>

                  {/* Tag overlays on image */}
                  {tags.map((tag, i) => (
                    <Pressable
                      key={i}
                      onPress={() => setTags(prev => prev.filter((_, idx) => idx !== i))}
                      style={[cs.tagBubble, {
                        left: `${tag.x * 100}%` as any,
                        top: `${tag.y * 100}%` as any,
                      }]}
                    >
                      <Text style={cs.tagBubbleText}>@{tag.username}</Text>
                    </Pressable>
                  ))}

                  {/* Tag mode hint */}
                  {tagMode && (
                    <View style={cs.tagHint}>
                      <Text style={cs.tagHintText}>Tippe auf das Bild zum Markieren</Text>
                    </View>
                  )}

                  <Pressable style={cs.removeImg} onPress={() => { setMediaUri(null); setMediaIsVideo(false); setTags([]) }}>
                    <Text style={{ color: '#fff', fontWeight: '800' }}>✕</Text>
                  </Pressable>
                  <Pressable style={cs.changeImg} onPress={pickMedia}>
                    <Text style={cs.changeImgText}>{mediaIsVideo ? '🎬 Ändern' : '🖼 Ändern'}</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable style={cs.imagePicker} onPress={pickMedia}>
                  <LinearGradient colors={['rgba(196,112,58,0.15)', 'rgba(196,112,58,0.05)']} style={cs.imagePickerGrad}>
                    <View style={cs.imagePickerPlus}>
                      <LinearGradient colors={gradients.brand} style={cs.imagePickerPlusGrad}>
                        <Text style={cs.imagePickerPlusText}>+</Text>
                      </LinearGradient>
                    </View>
                    <Text style={cs.imagePickerLabel}>Foto oder Video hinzufügen</Text>
                    <Text style={cs.imagePickerSub}>Tippe um Medien auszuwählen</Text>
                  </LinearGradient>
                </Pressable>
              )
            )}
            {type !== 'thread' && (
              <View style={cs.locationRow}>
                <Text style={{ fontSize: 16, marginRight: 8 }}>📍</Text>
                <TextInput
                  style={cs.locationInput} value={location} onChangeText={setLocation}
                  placeholder="Ort (optional)" placeholderTextColor="rgba(245,240,235,0.3)"
                />
              </View>
            )}
          </ScrollView>
          {type !== 'thread' && (
            <View style={cs.toolbar}>
              <Pressable style={cs.toolbarBtn} onPress={pickMedia}>
                <Text style={cs.toolbarIcon}>🖼</Text>
                <Text style={cs.toolbarLabel}>Foto / Video</Text>
              </Pressable>
              {mediaUri && (
                <Pressable style={cs.toolbarBtn} onPress={() => setTagMode(v => !v)}>
                  <Text style={cs.toolbarIcon}>👤</Text>
                  <Text style={[cs.toolbarLabel, tagMode && { color: colors.primary }]}>Markieren</Text>
                </Pressable>
              )}
              <Text style={cs.charCount}>{text.length}/500</Text>
            </View>
          )}

          {/* Tag user search sheet */}
          <Modal visible={showTagSearch} transparent animationType="slide" onRequestClose={() => { setShowTagSearch(false); setPendingPos(null) }}>
            <Pressable style={cs.tagSearchBg} onPress={() => { setShowTagSearch(false); setPendingPos(null); setTagSearch(''); setTagResults([]) }}>
              <Pressable style={cs.tagSearchSheet} onPress={() => {}}>
                <View style={cs.tagSearchHandle} />
                <Text style={cs.tagSearchTitle}>Person markieren</Text>
                <TextInput
                  style={cs.tagSearchInput}
                  placeholder="Name eingeben..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={tagSearch}
                  onChangeText={searchUsers}
                  autoFocus
                />
                {tagResults.map(r => (
                  <Pressable key={r.id} style={cs.tagResultRow} onPress={() => confirmTag(r.name)}>
                    <Text style={cs.tagResultName}>{r.name}</Text>
                  </Pressable>
                ))}
                <Pressable style={{ marginTop: 16, alignItems: 'center' }} onPress={() => { setShowTagSearch(false); setPendingPos(null); setTagSearch(''); setTagResults([]) }}>
                  <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Abbrechen</Text>
                </Pressable>
              </Pressable>
            </Pressable>
          </Modal>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}
const cs = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: 20, paddingBottom: 14, borderBottomWidth: 1, borderColor: colors.border },
  cancel: { fontSize: 15, color: colors.textMuted, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '900', color: colors.text },
  postBtn: { borderRadius: 20, overflow: 'hidden' },
  postBtnGrad: { paddingHorizontal: 16, paddingVertical: 8 },
  postBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  body: { padding: spacing.lg, flexGrow: 1 },
  textInput: { fontSize: 17, color: colors.text, lineHeight: 25, minHeight: 120, textAlignVertical: 'top', marginBottom: 16 },
  imgPreview: { width: '100%', height: 220, borderRadius: 14 },
  removeImg: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  locationRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
  locationInput: { flex: 1, fontSize: 14, color: colors.text },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: 12, borderTopWidth: 1, borderColor: colors.border },
  toolbarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toolbarIcon: { fontSize: 22 },
  toolbarLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  charCount: { fontSize: 12, color: colors.textMuted },
  imagePicker: { borderRadius: 18, overflow: 'hidden', marginBottom: 16 },
  imagePickerGrad: {
    height: 180, justifyContent: 'center', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: 'rgba(196,112,58,0.3)', borderRadius: 18, borderStyle: 'dashed',
  },
  imagePickerPlus: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', marginBottom: 4 },
  imagePickerPlusGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imagePickerPlusText: { color: '#fff', fontSize: 32, fontWeight: '300', lineHeight: 36 },
  imagePickerLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  imagePickerSub: { fontSize: 12, color: colors.textMuted },
  changeImg: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  changeImgText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  tagBubble: {
    position: 'absolute', transform: [{ translateX: -40 }, { translateY: -14 }],
    backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  tagBubbleText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  tagHint: {
    position: 'absolute', bottom: 44, left: 0, right: 0, alignItems: 'center',
  },
  tagHintText: {
    backgroundColor: 'rgba(232,132,92,0.85)', color: '#fff',
    fontSize: 12, fontWeight: '700', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  tagSearchBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  tagSearchSheet: {
    backgroundColor: '#111d2e', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40,
  },
  tagSearchHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 16 },
  tagSearchTitle: { fontSize: 16, fontWeight: '900', color: '#fff', marginBottom: 14 },
  tagSearchInput: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12,
    padding: 12, color: '#fff', fontSize: 15, marginBottom: 8,
  },
  tagResultRow: { paddingVertical: 13, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tagResultName: { color: '#fff', fontSize: 15, fontWeight: '600' },
})

// ── Main screen ───────────────────────────────────────────────
export default function FeedProfileScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const router = useRouter()

  const { openMenu: openMenuParam } = useLocalSearchParams<{ openMenu?: string }>()
  const [profile, setProfile] = useState<ProfileData>({ name: '', bio: null, profile_image_url: null, country: null, feed_name: null, feed_bio: null, feed_avatar_url: null })
  const [editVisible, setEditVisible] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [selectedPost, setSelectedPost] = useState<OwnPost | null>(null)
  const [viewerIsSaved, setViewerIsSaved] = useState(false)
  const [editingPost, setEditingPost] = useState<{ id: string; content: string; location: string } | null>(null)
  const [storyUploading, setStoryUploading] = useState(false)
  const [storyViewerVisible, setStoryViewerVisible] = useState(false)
  const { groups: storyGroups, addStory, markSeen, deleteStory, load: reloadStories } = useStories(userId)
  const myStoryGroup = storyGroups.find(g => g.isMe)
  const { savedPosts, loadSaved, toggleSave, isSaved } = useSaved(userId)
  const { highlights, load: loadHighlights, loadStories: loadHighlightStories, createHighlight, addToHighlight, deleteHighlight } = useHighlights(userId)
  const [highlightViewer, setHighlightViewer] = useState<{ stories: any[]; name: string } | null>(null)
  const [showAddHighlight, setShowAddHighlight] = useState<{ imageUrl: string; mediaType: 'image'|'video'; storyId?: string } | null>(null)
  const [newHighlightName, setNewHighlightName] = useState('')

  useEffect(() => {
    if (openMenuParam === '1') {
      setMenuVisible(true)
      router.setParams({ openMenu: '' })
    }
  }, [openMenuParam])
  const [stats, setStats] = useState<ProfileStats>({ postCount: 0, followerCount: 0, followingCount: 0 })
  const [posts, setPosts] = useState<OwnPost[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<'grid' | 'threads' | 'saved'>('grid')
  const [composeType, setComposeType] = useState<'post' | 'thread'>('post')
  const [composeVisible, setComposeVisible] = useState(false)
  const tabAnim = useRef(new Animated.Value(0)).current

  const load = async () => {
    if (!userId) return
    const [profileRes, postsRes, followersRes, followingRes] = await Promise.all([
      supabase.from('profiles').select('name, bio, profile_image_url, country, feed_name, feed_bio, feed_avatar_url').eq('id', userId).single(),
      supabase.from('posts')
        .select('id, user_id, content, image_url, video_url, media_urls, location, type, like_count, repost_count, comment_count, created_at, tags')
        .eq('user_id', userId)
        .neq('archived', true)
        .order('created_at', { ascending: false }),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
    ])
    if (profileRes.data) setProfile(profileRes.data)
    if (postsRes.error) console.warn('posts error:', postsRes.error.message)
    const pd = profileRes.data as any
    const allPosts: OwnPost[] = (postsRes.data ?? []).map((p: any) => ({
      ...p,
      author: { name: pd?.feed_name || pd?.name || '', profile_image_url: pd?.feed_avatar_url || pd?.profile_image_url },
      repost_of: null, liked_by_me: false, reposted_by_me: false,
    }))
    setPosts(allPosts)
    setStats({
      postCount: allPosts.filter(p => p.image_url != null || p.video_url != null || (p as any).media_urls != null).length,
      followerCount: followersRes.count ?? 0,
      followingCount: followingRes.count ?? 0,
    })
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load() }, [userId])
  useEffect(() => { if (userId) loadHighlights() }, [userId])
  useEffect(() => { if (tab === 'saved' && userId) loadSaved() }, [tab, userId])

  const doRefresh = () => { setRefreshing(true); load(); if (tab === 'saved') loadSaved() }

  const openCompose = (type: 'post' | 'thread') => { setComposeType(type); setComposeVisible(true) }

  const handleDelete = (postId: string) => {
    ActionSheetIOS.showActionSheetWithOptions(
      { options: ['Post löschen', 'Abbrechen'], destructiveButtonIndex: 0, cancelButtonIndex: 1 },
      async idx => {
        if (idx === 0) {
          await supabase.from('posts').delete().eq('id', postId)
          setPosts(prev => {
            const deleted = prev.find(p => p.id === postId)
            const isMedia = deleted?.image_url != null || (deleted as any)?.video_url != null
            if (isMedia) setStats(s => ({ ...s, postCount: s.postCount - 1 }))
            return prev.filter(p => p.id !== postId)
          })
        }
      }
    )
  }

  const handleUpdatePost = async (postId: string, content: string, location: string | null) => {
    const { error } = await supabase.from('posts').update({ content: content || null, location }).eq('id', postId)
    if (error) throw new Error(error.message)
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: content || null, location } : p))
  }

  const openMenu = () => setMenuVisible(true)

  const pickAndUploadStory = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Kein Zugriff', 'Bitte Fotogalerie-Zugriff erlauben.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.85,
      videoMaxDuration: 30,
    })
    if (result.canceled) return
    setStoryUploading(true)
    try {
      const asset = result.assets[0]
      const uri = asset.uri
      const isVideo = asset.type === 'video'
      const ext = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? (isVideo ? 'mp4' : 'jpg')
      const mime = isVideo ? 'video/mp4' : 'image/jpeg'
      const filename = `stories/${userId}/${Date.now()}.${ext}`
      const { data: { session: s } } = await supabase.auth.getSession()
      const token = s?.access_token
      if (!token) throw new Error('Nicht eingeloggt')
      const up = await FileSystem.uploadAsync(
        `${SUPABASE_URL}/storage/v1/object/profile-images/${filename}`, uri,
        { httpMethod: 'POST', uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': mime, 'x-upsert': 'true' } }
      )
      if (up.status < 200 || up.status >= 300) throw new Error(`Upload ${up.status}`)
      const { data: pub } = supabase.storage.from('profile-images').getPublicUrl(filename)
      await addStory(pub.publicUrl, null, isVideo ? 'video' : 'image')
      Alert.alert('Story hochgeladen ✓', 'Deine Story ist jetzt sichtbar.')
    } catch (e: any) {
      Alert.alert('Fehler', e.message)
    } finally {
      setStoryUploading(false)
    }
  }

  const imagePosts = posts.filter(p => p.image_url != null || p.video_url != null || (p as any).media_urls != null)
  const threadPosts = posts.filter(p => p.image_url == null && p.video_url == null && (p as any).media_urls == null && p.content)

  // ── Header component
  function ProfileHeader() {
    return (
      <View style={styles.profileHeader}>
        {/* Avatar + Stats row side by side */}
        <View style={styles.avatarStatsRow}>
          {/* Avatar — gradient ring when story exists */}
          <Pressable onPress={() => myStoryGroup ? setStoryViewerVisible(true) : pickAndUploadStory()} style={styles.avatarWrap}>
            {myStoryGroup ? (
              <LinearGradient colors={['#f9a825', '#e8845c', '#c2305e']} style={styles.storyRing}>
                <View style={styles.storyRingInner}>
                  {(profile.feed_avatar_url || profile.profile_image_url) ? (
                    <Image source={{ uri: profile.feed_avatar_url ?? profile.profile_image_url! }} style={styles.avatar} />
                  ) : (
                    <LinearGradient colors={gradients.brand} style={styles.avatarFallback}>
                      <Text style={styles.avatarInitial}>{((profile.feed_name || profile.name) || '?').charAt(0).toUpperCase()}</Text>
                    </LinearGradient>
                  )}
                </View>
              </LinearGradient>
            ) : (
              <>
                {(profile.feed_avatar_url || profile.profile_image_url) ? (
                  <Image source={{ uri: profile.feed_avatar_url ?? profile.profile_image_url! }} style={styles.avatar} />
                ) : (
                  <LinearGradient colors={gradients.brand} style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>{((profile.feed_name || profile.name) || '?').charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                )}
              </>
            )}
            {/* + button always visible */}
            <View style={styles.storyPlusBtn}>
              {storyUploading
                ? <ActivityIndicator color="#fff" size="small" />
                : <LinearGradient colors={gradients.brand} style={styles.storyPlusGrad}>
                    <Text style={styles.storyPlusText}>+</Text>
                  </LinearGradient>
              }
            </View>
          </Pressable>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.postCount}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.followerCount}</Text>
              <Text style={styles.statLabel}>Follower</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.followingCount}</Text>
              <Text style={styles.statLabel}>Folge ich</Text>
            </View>
          </View>
        </View>

        {/* Name + bio — uses feed-specific fields, falls back to swipe profile */}
        <View style={styles.bioSection}>
          <Text style={styles.profileName}>{profile.feed_name || profile.name || 'Dein Profil'}</Text>
          {profile.country ? <Text style={styles.profileCountry}>📍 {profile.country}</Text> : null}
          {(profile.feed_bio || profile.bio) ? <Text style={styles.profileBio}>{profile.feed_bio ?? profile.bio}</Text> : null}
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <Pressable style={styles.editBtn} onPress={() => setEditVisible(true)}>
            <Text style={styles.editBtnText}>Profil bearbeiten</Text>
          </Pressable>
        </View>

        {/* Story Highlights */}
        {(highlights.length > 0 || myStoryGroup) && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.highlightsRow} contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingVertical: 8 }}>
            {highlights.map(h => (
              <View key={h.id} style={styles.highlightItem}>
                <Pressable
                  onPress={async () => {
                    const stories = await loadHighlightStories(h.id)
                    setHighlightViewer({ stories, name: h.name })
                  }}
                >
                  {h.cover_url ? (
                    <Image source={{ uri: h.cover_url }} style={styles.highlightCover} />
                  ) : (
                    <LinearGradient colors={gradients.brand} style={styles.highlightCover} />
                  )}
                </Pressable>
                <Pressable
                  style={styles.highlightDeleteBtn}
                  onPress={() => Alert.alert(h.name, 'Highlight löschen?', [
                    { text: 'Löschen', style: 'destructive', onPress: () => deleteHighlight(h.id) },
                    { text: 'Abbrechen', style: 'cancel' },
                  ])}
                >
                  <Text style={styles.highlightDeleteIcon}>✕</Text>
                </Pressable>
                <Text style={styles.highlightName} numberOfLines={1}>{h.name}</Text>
              </View>
            ))}
            {/* Add new highlight button */}
            <Pressable style={styles.highlightItem}
              onPress={() => {
                if (!myStoryGroup) { Alert.alert('Keine Story', 'Erstelle zuerst eine Story.'); return }
                const story = myStoryGroup.stories[0]
                setShowAddHighlight({ imageUrl: story.image_url, mediaType: story.media_type, storyId: story.id })
                setNewHighlightName('')
              }}
            >
              <View style={[styles.highlightCover, styles.highlightAdd]}>
                <Text style={{ fontSize: 28, color: 'rgba(255,255,255,0.7)' }}>+</Text>
              </View>
              <Text style={styles.highlightName}>Neu</Text>
            </Pressable>
          </ScrollView>
        )}

        {/* New post — large camera card + thread pill */}
        <View style={styles.createSection}>
          {/* Big photo post card */}
          <Pressable style={styles.photoCard} onPress={() => openCompose('post')} activeOpacity={0.85}>
            <LinearGradient
              colors={['#1a3a5c', '#7e4a35', '#c4703a']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Frosted icon circle */}
            <View style={styles.photoCardCircle}>
              <Text style={styles.photoCardCameraIcon}>📷</Text>
            </View>
            <Text style={styles.photoCardTitle}>Foto / Video</Text>
            <Text style={styles.photoCardSub}>Teile deinen Moment</Text>
            {/* Plus badge */}
            <View style={styles.photoCardPlus}>
              <LinearGradient colors={gradients.brand} style={styles.photoCardPlusGrad}>
                <Text style={styles.photoCardPlusText}>+</Text>
              </LinearGradient>
            </View>
          </Pressable>

          {/* Thread pill — secondary */}
          <Pressable style={styles.threadPill} onPress={() => openCompose('thread')} activeOpacity={0.8}>
            <View style={styles.threadPillIcon}>
              <Text style={{ fontSize: 18 }}>✍️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.threadPillTitle}>Thread schreiben</Text>
              <Text style={styles.threadPillSub}>Gedanken teilen…</Text>
            </View>
            <LinearGradient colors={gradients.brand} style={styles.threadPillBtn}>
              <Text style={styles.threadPillBtnText}>+</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabBar}>
          <Pressable style={[styles.tabItem, tab === 'grid' && styles.tabItemActive]} onPress={() => setTab('grid')}>
            <Text style={[styles.tabIcon, tab === 'grid' && styles.tabIconActive]}>⊞</Text>
          </Pressable>
          <Pressable style={[styles.tabItem, tab === 'threads' && styles.tabItemActive]} onPress={() => setTab('threads')}>
            <Text style={[styles.tabIcon, tab === 'threads' && styles.tabIconActive]}>☰</Text>
          </Pressable>
          <Pressable style={[styles.tabItem, tab === 'saved' && styles.tabItemActive]} onPress={() => setTab('saved')}>
            <Text style={[styles.tabIcon, tab === 'saved' && styles.tabIconActive]}>🔖</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  // ── Grid cell
  function GridCell({ post }: { post: OwnPost }) {
    return (
      <Pressable style={styles.cell} onPress={() => { setViewerIsSaved(tab === 'saved'); setSelectedPost(post) }} onLongPress={() =>
        Alert.alert('Beitrag', '', [
          { text: 'Bearbeiten', onPress: () => setEditingPost({ id: post.id, content: post.content ?? '', location: post.location ?? '' }) },
          { text: 'Löschen', style: 'destructive', onPress: () => handleDelete(post.id) },
          { text: 'Abbrechen', style: 'cancel' },
        ])
      }>
        {post.image_url
          ? <Image source={{ uri: post.image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <LinearGradient colors={['#0d1b2e', '#1a2a3e']} style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
              {post.video_url && <Text style={{ fontSize: 32, color: 'rgba(255,255,255,0.6)' }}>▶</Text>}
            </LinearGradient>}
        <View style={styles.cellOverlay}>
          {post.video_url && <Text style={{ fontSize: 14, color: '#fff', marginRight: 4 }}>▶</Text>}
          <Text style={styles.cellLikes}>♥ {post.like_count}</Text>
        </View>
      </Pressable>
    )
  }

  // ── Thread card
  function ThreadCard({ post }: { post: OwnPost }) {
    return (
      <Pressable style={styles.threadCard} onLongPress={() => handleDelete(post.id)}>
        <Text style={styles.threadContent}>{post.content}</Text>
        <View style={styles.threadMeta}>
          {post.location ? <Text style={styles.threadMetaText}>📍 {post.location} · </Text> : null}
          <Text style={styles.threadMetaText}>{timeAgo(post.created_at)}</Text>
          <Text style={styles.threadMetaText}> · ♥ {post.like_count}</Text>
        </View>
      </Pressable>
    )
  }

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  )

  return (
    <View style={styles.root}>
      {/* Back / header */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.push('/feed')} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>{profile.feed_name || profile.name || 'Profil'}</Text>
        <Pressable style={styles.menuBtn} onPress={openMenu}>
          <Text style={styles.menuIcon}>≡</Text>
        </Pressable>
      </View>

      <FlatList
        data={tab === 'grid' ? imagePosts : tab === 'threads' ? threadPosts : savedPosts}
        keyExtractor={p => p.id}
        numColumns={tab !== 'threads' ? 3 : 1}
        key={tab}
        contentContainerStyle={styles.list}
        columnWrapperStyle={tab !== 'threads' ? { gap: 1.5 } : undefined}
        ItemSeparatorComponent={tab !== 'threads' ? () => <View style={{ height: 1.5 }} /> : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={<ProfileHeader />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>{tab === 'grid' ? '🖼' : tab === 'threads' ? '💬' : '🔖'}</Text>
            <Text style={styles.emptyText}>
              {tab === 'grid' ? 'Noch keine Bilder gepostet' : tab === 'threads' ? 'Noch keine Threads' : 'Noch nichts gespeichert'}
            </Text>
            {tab !== 'saved' && (
              <Pressable style={{ borderRadius: 50, overflow: 'hidden', marginTop: 16 }}
                onPress={() => openCompose(tab === 'grid' ? 'post' : 'thread')}>
                <LinearGradient colors={gradients.brand} style={{ paddingHorizontal: 24, paddingVertical: 12 }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>
                    {tab === 'grid' ? 'Ersten Post erstellen' : 'Ersten Thread erstellen'}
                  </Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>
        }
        renderItem={({ item }) => tab === 'threads' ? <ThreadCard post={item} /> : <GridCell post={item} />}
      />

      <FeedProfileTabBar />

      <ComposeModal
        visible={composeVisible}
        userId={userId}
        type={composeType}
        onClose={() => setComposeVisible(false)}
        onDone={(goToFeed) => { load(); if (goToFeed) router.push('/threads') }}
      />

      <FeedEditModal
        visible={editVisible}
        userId={userId}
        profile={profile}
        onClose={() => setEditVisible(false)}
        onSaved={(updated) => { setProfile(prev => ({ ...prev, ...updated })); setEditVisible(false) }}
      />

      {/* Full-screen post viewer */}
      {selectedPost && (
        <PostViewer
          posts={viewerIsSaved ? (savedPosts as OwnPost[]) : imagePosts}
          startId={selectedPost.id}
          profile={profile}
          onClose={() => setSelectedPost(null)}
          isSavedViewer={viewerIsSaved}
          onUnsave={viewerIsSaved ? async (id) => { await toggleSave(id); setSelectedPost(null) } : undefined}
          onDelete={async (id) => {
            setSelectedPost(null)
            await supabase.from('posts').delete().eq('id', id)
            setPosts(prev => {
              const deleted = prev.find(p => p.id === id)
              const isMedia = deleted?.image_url != null || (deleted as any)?.video_url != null
              if (isMedia) setStats(s => ({ ...s, postCount: s.postCount - 1 }))
              return prev.filter(p => p.id !== id)
            })
          }}
          onEdit={(id, content, location) => {
            setSelectedPost(null)
            setEditingPost({ id, content, location })
          }}
        />
      )}

      {myStoryGroup && (
        <StoryViewer
          groups={[myStoryGroup]}
          startGroupIndex={0}
          visible={storyViewerVisible}
          onClose={() => setStoryViewerVisible(false)}
          onSeen={markSeen}
          onDelete={async (storyId) => { await deleteStory(storyId) }}
          onAddToHighlight={(storyId, imageUrl, mediaType) => {
            setStoryViewerVisible(false)
            setShowAddHighlight({ imageUrl, mediaType, storyId })
            setNewHighlightName('')
          }}
          isOwner
          userId={userId}
        />
      )}

      {/* Highlight Viewer */}
      {highlightViewer && (
        <StoryViewer
          groups={[{
            user_id: userId,
            name: highlightViewer.name,
            profile_image_url: profile.feed_avatar_url ?? profile.profile_image_url,
            stories: highlightViewer.stories.map((s: any) => ({
              id: s.id,
              user_id: userId,
              image_url: s.image_url,
              media_type: s.media_type ?? 'image',
              caption: null,
              created_at: s.created_at,
              expires_at: new Date(Date.now() + 86400000).toISOString(),
              seen_count: 0,
            })),
            seen: false,
            isMe: true,
          }]}
          startGroupIndex={0}
          visible
          onClose={() => setHighlightViewer(null)}
          onSeen={() => {}}
          isOwner
          userId={userId}
        />
      )}

      {/* Add to Highlight modal */}
      {showAddHighlight && (
        <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddHighlight(null)}>
          <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 20 }}>Highlight erstellen</Text>
            <TextInput
              style={[styles.editTextInput, { backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 16 }]}
              value={newHighlightName}
              onChangeText={setNewHighlightName}
              placeholder="Name des Highlights…"
              placeholderTextColor="rgba(245,240,235,0.3)"
              autoFocus
            />
            {/* Existing highlights */}
            {highlights.length > 0 && (
              <>
                <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 10 }}>Zu bestehendem hinzufügen:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {highlights.map(h => (
                      <Pressable key={h.id} style={styles.highlightItem} onPress={async () => {
                        await addToHighlight(h.id, showAddHighlight.imageUrl, showAddHighlight.mediaType, showAddHighlight.storyId)
                        setShowAddHighlight(null)
                        Alert.alert('Hinzugefügt!', `Zur Highlight-Sammlung "${h.name}" hinzugefügt.`)
                      }}>
                        {h.cover_url ? (
                          <Image source={{ uri: h.cover_url }} style={styles.highlightCover} />
                        ) : (
                          <LinearGradient colors={gradients.brand} style={styles.highlightCover} />
                        )}
                        <Text style={styles.highlightName}>{h.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}
            <Pressable style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 12 }} onPress={async () => {
              if (!newHighlightName.trim()) { Alert.alert('', 'Bitte einen Namen eingeben.'); return }
              try {
                await createHighlight(newHighlightName.trim(), showAddHighlight.imageUrl, showAddHighlight.mediaType, showAddHighlight.storyId)
                setShowAddHighlight(null)
                Alert.alert('Erstellt!', `Highlight "${newHighlightName}" wurde erstellt.`)
              } catch (e: any) { Alert.alert('Fehler', e.message) }
            }}>
              <LinearGradient colors={gradients.brand} style={{ paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Neues Highlight erstellen</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={() => setShowAddHighlight(null)} style={{ alignItems: 'center', padding: 14 }}>
              <Text style={{ color: colors.textMuted, fontSize: 15 }}>Abbrechen</Text>
            </Pressable>
          </View>
        </Modal>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditingPost(null)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: colors.background }}>
              <View style={styles.editHeader}>
                <Pressable onPress={() => setEditingPost(null)} style={styles.editCancelBtn}>
                  <Text style={styles.editCancelText}>Abbrechen</Text>
                </Pressable>
                <Text style={styles.editTitle}>Beitrag bearbeiten</Text>
                <Pressable style={styles.editSaveBtn} onPress={async () => {
                  try {
                    await handleUpdatePost(editingPost.id, editingPost.content, editingPost.location || null)
                    setEditingPost(null)
                  } catch (e: any) { Alert.alert('Fehler', e.message) }
                }}>
                  <LinearGradient colors={gradients.brand} style={styles.editSaveGrad}>
                    <Text style={styles.editSaveText}>Speichern</Text>
                  </LinearGradient>
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={{ padding: 20 }}>
                <TextInput
                  style={styles.editTextInput}
                  value={editingPost.content}
                  onChangeText={t => setEditingPost(p => p ? { ...p, content: t } : p)}
                  placeholder="Beschreibe deinen Beitrag…"
                  placeholderTextColor="rgba(245,240,235,0.3)"
                  multiline
                  maxLength={500}
                  autoFocus
                />
                <View style={styles.editLocation}>
                  <Text style={{ fontSize: 16, marginRight: 8 }}>📍</Text>
                  <TextInput
                    style={styles.editLocationInput}
                    value={editingPost.location}
                    onChangeText={t => setEditingPost(p => p ? { ...p, location: t } : p)}
                    placeholder="Ort (optional)"
                    placeholderTextColor="rgba(245,240,235,0.3)"
                  />
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      <SideMenuDrawer
        visible={menuVisible}
        username={profile.feed_name || profile.name}
        avatar={profile.feed_avatar_url ?? profile.profile_image_url}
        onClose={() => setMenuVisible(false)}
        onEditProfile={() => setEditVisible(true)}
      />
    </View>
  )
}

// ── Instagram-style side menu ─────────────────────────────────
function SideMenuDrawer({ visible, username, avatar, onClose, onEditProfile }: {
  visible: boolean
  username: string
  avatar: string | null
  onClose: () => void
  onEditProfile: () => void
}) {
  const router = useRouter()
  const slideAnim = useRef(new Animated.Value(width)).current

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : width,
      duration: 280,
      useNativeDriver: true,
    }).start()
  }, [visible])

  if (!visible) return null

  const go = (route: string) => { onClose(); router.push(route as any) }

  const SECTIONS = [
    {
      title: 'Dein Konto',
      items: [
        { icon: '👤', label: 'Übersicht', sub: 'Profil & Statistiken', onPress: () => go('/account-overview') },
        { icon: '🔑', label: 'Passwort & Sicherheit', sub: 'Passwort ändern, 2FA', onPress: () => go('/password-security') },
        { icon: '📋', label: 'Personenbezogene Angaben', sub: 'Name, E-Mail, Geburtstag', onPress: () => go('/personal-info') },
        { icon: '🔗', label: 'Verknüpfte Funktionen', sub: 'Verbundene Apps & Dienste', onPress: () => go('/linked-features') },
        { icon: '📢', label: 'Werbepräferenzen', sub: 'Anzeigen & Interessen', onPress: () => go('/ad-preferences') },
      ],
    },
    {
      title: 'Weitere Optionen',
      items: [
        { icon: '♥', label: 'Gelikte Beiträge', sub: 'Deine Likes ansehen', onPress: () => go('/liked-posts') },
        { icon: '⭐', label: 'Enge Freunde', sub: 'Story-Zugang verwalten', onPress: () => go('/close-friends') },
        { icon: '🗄', label: 'Archiv', sub: 'Archivierte Beiträge', onPress: () => go('/archive') },
        { icon: '🔒', label: 'Datenschutz', sub: 'Sichtbarkeit & Privatsphäre', onPress: () => go('/privacy-settings') },
        { icon: '✏️', label: 'Feed-Profil bearbeiten', sub: 'Name, Bio, Foto', onPress: () => { onClose(); onEditProfile() } },
      ],
    },
  ]

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable style={sm.backdrop} onPress={onClose} />

      {/* Drawer */}
      <Animated.View style={[sm.drawer, { transform: [{ translateX: slideAnim }] }]}>
        {/* Header */}
        <View style={sm.drawerHeader}>
          <View style={sm.drawerUser}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={sm.drawerAvatar} />
            ) : (
              <LinearGradient colors={gradients.brand} style={sm.drawerAvatarFallback}>
                <Text style={sm.drawerAvatarInitial}>{(username || '?').charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            )}
            <Text style={sm.drawerUsername}>{username || 'Mein Profil'}</Text>
          </View>
          <Pressable onPress={onClose} style={sm.closeBtn} hitSlop={12}>
            <Text style={sm.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={sm.content} showsVerticalScrollIndicator={false}>
          {SECTIONS.map(section => (
            <View key={section.title} style={sm.section}>
              <Text style={sm.sectionTitle}>{section.title}</Text>
              {section.items.map((item, i) => (
                <Pressable key={item.label} style={[sm.item, i === 0 && sm.itemFirst, i === section.items.length - 1 && sm.itemLast]}
                  onPress={item.onPress}>
                  <View style={sm.itemIcon}>
                    <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                  </View>
                  <View style={sm.itemText}>
                    <Text style={sm.itemLabel}>{item.label}</Text>
                    <Text style={sm.itemSub}>{item.sub}</Text>
                  </View>
                  <Text style={sm.itemArrow}>›</Text>
                </Pressable>
              ))}
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  )
}
const sm = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  drawer: {
    position: 'absolute', top: 0, right: 0, bottom: 0,
    width: width * 0.82,
    backgroundColor: '#0d1b2e',
    borderLeftWidth: 1, borderColor: 'rgba(232,132,92,0.15)',
    shadowColor: '#000', shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 30,
  },
  drawerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 64, paddingBottom: 20,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  drawerUser: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  drawerAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: colors.primary },
  drawerAvatarFallback: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  drawerAvatarInitial: { color: '#fff', fontWeight: '900', fontSize: 18 },
  drawerUsername: { fontSize: 16, fontWeight: '900', color: colors.text },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center',
  },
  closeBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '700' },
  content: { padding: 16, gap: 6 },
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 4, marginBottom: 8,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14, paddingVertical: 13,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  itemFirst: { borderTopWidth: 0, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  itemLast: { borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
  itemIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(232,132,92,0.12)', justifyContent: 'center', alignItems: 'center',
  },
  itemText: { flex: 1 },
  itemLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  itemSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  itemArrow: { fontSize: 20, color: 'rgba(255,255,255,0.25)', fontWeight: '300' },
})

// ── Feed-specific profile editor ──────────────────────────────
function FeedEditModal({ visible, userId, profile, onClose, onSaved }: {
  visible: boolean
  userId: string
  profile: ProfileData
  onClose: () => void
  onSaved: (updated: { feed_name: string | null; feed_bio: string | null; feed_avatar_url: string | null }) => void
}) {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (visible) {
      setName(profile.feed_name ?? profile.name ?? '')
      setBio(profile.feed_bio ?? profile.bio ?? '')
      setAvatarUri(null)
    }
  }, [visible])

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 })
    if (!res.canceled) setAvatarUri(res.assets[0].uri)
  }

  const uploadAvatar = async (uri: string): Promise<string> => {
    const ext = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? 'jpg'
    const fname = `feed-avatar/${userId}/${Date.now()}.${ext}`
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

  const save = async () => {
    setSaving(true)
    try {
      let newAvatarUrl = profile.feed_avatar_url
      if (avatarUri) newAvatarUrl = await uploadAvatar(avatarUri)
      const updates = {
        feed_name: name.trim() || null,
        feed_bio: bio.trim() || null,
        feed_avatar_url: newAvatarUrl ?? null,
      }
      const { error } = await supabase.from('profiles').update(updates as any).eq('id', userId)
      if (error) throw new Error(error.message)
      onSaved(updates)
    } catch (e: any) {
      Alert.alert('Fehler', e.message)
    } finally {
      setSaving(false)
    }
  }

  const currentAvatar = avatarUri ?? profile.feed_avatar_url ?? profile.profile_image_url

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={em.root}>
        <View style={em.header}>
          <Pressable onPress={onClose}><Text style={em.cancel}>Abbrechen</Text></Pressable>
          <Text style={em.title}>Feed-Profil bearbeiten</Text>
          <Pressable onPress={save} disabled={saving} style={[em.saveBtn, saving && { opacity: 0.5 }]}>
            <LinearGradient colors={gradients.brand} style={em.saveBtnGrad}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={em.saveBtnText}>Speichern</Text>}
            </LinearGradient>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={em.body}>
          {/* Avatar picker */}
          <View style={em.avatarSection}>
            <Pressable onPress={pickAvatar} style={em.avatarWrap}>
              {currentAvatar ? (
                <Image source={{ uri: currentAvatar }} style={em.avatar} />
              ) : (
                <LinearGradient colors={gradients.brand} style={em.avatarFallback}>
                  <Text style={em.avatarInitial}>{(name || '?').charAt(0).toUpperCase()}</Text>
                </LinearGradient>
              )}
              <View style={em.cameraOverlay}>
                <Text style={{ fontSize: 16 }}>📷</Text>
              </View>
            </Pressable>
            <Text style={em.avatarHint}>Nur für den Feed</Text>
          </View>

          <Text style={em.noteBox}>
            ✈️ Das Feed-Profil ist unabhängig von deinem Tinder-Profil.{'\n'}
            Änderungen hier erscheinen nur im Travel Feed.
          </Text>

          <View style={em.field}>
            <Text style={em.label}>Anzeigename</Text>
            <TextInput
              style={em.input} value={name} onChangeText={setName}
              placeholder="Dein Name im Feed" placeholderTextColor="rgba(245,240,235,0.3)"
              maxLength={40}
            />
          </View>

          <View style={em.field}>
            <Text style={em.label}>Bio</Text>
            <TextInput
              style={[em.input, em.inputMulti]} value={bio} onChangeText={setBio}
              placeholder="Kurze Bio für deinen Feed…" placeholderTextColor="rgba(245,240,235,0.3)"
              multiline maxLength={200}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}
const em = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderColor: colors.border,
  },
  cancel: { fontSize: 15, color: colors.textMuted, fontWeight: '600' },
  title: { fontSize: 15, fontWeight: '900', color: colors.text },
  saveBtn: { borderRadius: 20, overflow: 'hidden' },
  saveBtnGrad: { paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  body: { padding: spacing.lg, gap: 20, paddingBottom: 60 },
  avatarSection: { alignItems: 'center', marginBottom: 8 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 2.5, borderColor: colors.primary },
  avatarFallback: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 36, color: '#fff', fontWeight: '900' },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.background,
  },
  avatarHint: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
  noteBox: {
    backgroundColor: 'rgba(196,112,58,0.12)', borderRadius: 12, padding: 14,
    fontSize: 13, color: 'rgba(245,240,235,0.65)', lineHeight: 19,
    borderWidth: 1, borderColor: 'rgba(196,112,58,0.2)',
  },
  field: { gap: 8 },
  label: { fontSize: 12, fontWeight: '800', color: 'rgba(245,240,235,0.45)', letterSpacing: 0.8, textTransform: 'uppercase' },
  input: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border,
  },
  inputMulti: { minHeight: 100, textAlignVertical: 'top' },
})

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'gerade eben'
  if (s < 3600) return `vor ${Math.floor(s / 60)} Min`
  if (s < 86400) return `vor ${Math.floor(s / 3600)} Std`
  return `vor ${Math.floor(s / 86400)} Tagen`
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: 10,
    borderBottomWidth: 1, borderColor: 'rgba(245,240,235,0.07)',
  },
  backBtn: { width: 36, justifyContent: 'center' },
  backText: { fontSize: 28, color: '#fff', fontWeight: '300' },
  topBarTitle: { fontSize: 16, fontWeight: '900', color: colors.text },
  menuBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  menuIcon: { fontSize: 22, color: colors.text, fontWeight: '700' },

  list: { paddingBottom: 120 },

  // Profile header
  profileHeader: { paddingBottom: 4 },
  avatarStatsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: 20, paddingBottom: 12, gap: 16,
  },
  avatarWrap: { position: 'relative' },
  storyRing: { width: 90, height: 90, borderRadius: 45, padding: 3, justifyContent: 'center', alignItems: 'center' },
  storyRingInner: { borderRadius: 42, borderWidth: 2.5, borderColor: colors.background, overflow: 'hidden' },
  avatar: { width: 82, height: 82, borderRadius: 41, borderWidth: 2.5, borderColor: colors.primary },
  avatarFallback: { width: 82, height: 82, borderRadius: 41, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 32, color: '#fff', fontWeight: '900' },
  storyPlusBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: colors.background,
    overflow: 'hidden',
  },
  storyPlusGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  storyPlusText: { color: '#fff', fontSize: 16, fontWeight: '900', lineHeight: 18 },

  statsRow: {
    flex: 1, flexDirection: 'row', justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '900', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 1 },

  bioSection: { paddingHorizontal: spacing.lg, marginBottom: 14 },
  profileName: { fontSize: 16, fontWeight: '900', color: colors.text, marginBottom: 2 },
  profileCountry: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  profileBio: { fontSize: 14, color: colors.text, lineHeight: 20 },

  actionRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: 8, marginBottom: 14 },
  editBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 12,
    backgroundColor: 'rgba(245,240,235,0.1)', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(245,240,235,0.18)',
  },
  editBtnText: { fontSize: 14, fontWeight: '800', color: colors.text },
  shareBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(245,240,235,0.1)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(245,240,235,0.18)',
  },
  shareBtnText: { fontSize: 16, color: colors.text },

  // Create section
  createSection: { paddingHorizontal: spacing.lg, gap: 10, marginBottom: 16 },

  // Big photo card
  photoCard: {
    height: 140, borderRadius: 22, overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center', gap: 4,
    shadowColor: '#c4703a', shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  photoCardCircle: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
  },
  photoCardCameraIcon: { fontSize: 26 },
  photoCardTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },
  photoCardSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  photoCardPlus: {
    position: 'absolute', top: 12, right: 12,
    width: 30, height: 30, borderRadius: 15, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4,
  },
  photoCardPlusGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoCardPlusText: { color: '#fff', fontSize: 20, fontWeight: '900', lineHeight: 22 },

  // Thread pill
  threadPill: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(245,240,235,0.07)',
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(245,240,235,0.12)',
  },
  threadPillIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(245,240,235,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  threadPillTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 2 },
  threadPillSub: { fontSize: 12, color: colors.textMuted },
  threadPillBtn: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  threadPillBtnText: { color: '#fff', fontSize: 20, fontWeight: '900', lineHeight: 22 },

  // Tab bar (grid / threads)
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1, borderColor: 'rgba(245,240,235,0.08)',
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabItemActive: { borderBottomWidth: 2, borderColor: colors.primary },
  tabIcon: { fontSize: 22, color: 'rgba(245,240,235,0.3)' },
  tabIconActive: { color: colors.primary },

  // Grid
  cell: { width: GRID_CELL, height: GRID_CELL, backgroundColor: colors.surface, overflow: 'hidden' },
  cellOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 4, backgroundColor: 'rgba(0,0,0,0.3)' },
  cellLikes: { fontSize: 10, color: '#fff', fontWeight: '700' },

  // Threads
  threadCard: {
    paddingHorizontal: spacing.lg, paddingVertical: 16,
    borderBottomWidth: 1, borderColor: 'rgba(245,240,235,0.07)',
  },
  threadContent: { fontSize: 15, color: colors.text, lineHeight: 22, marginBottom: 8 },
  threadMeta: { flexDirection: 'row' },
  threadMetaText: { fontSize: 12, color: colors.textMuted },

  // Empty
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.textMuted, textAlign: 'center' },

  // Highlights
  highlightsRow: { marginBottom: 4 },
  highlightItem: { alignItems: 'center', width: 70, position: 'relative' },
  highlightCover: { width: 64, height: 64, borderRadius: 32, marginBottom: 6, borderWidth: 2, borderColor: colors.primary },
  highlightAdd: { backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  highlightName: { fontSize: 11, color: colors.text, textAlign: 'center', fontWeight: '600' },
  highlightDeleteBtn: {
    position: 'absolute', top: -4, right: 0,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#ff3b30', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.background,
  },
  highlightDeleteIcon: { color: '#fff', fontSize: 9, fontWeight: '900' },

  // Edit post modal
  editHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderColor: colors.border,
  },
  editTitle: { fontSize: 16, fontWeight: '900', color: colors.text },
  editCancelBtn: { padding: 4 },
  editCancelText: { fontSize: 15, color: colors.textMuted, fontWeight: '600' },
  editSaveBtn: { borderRadius: 20, overflow: 'hidden' },
  editSaveGrad: { paddingHorizontal: 16, paddingVertical: 8 },
  editSaveText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  editTextInput: {
    fontSize: 17, color: colors.text, lineHeight: 25,
    minHeight: 120, textAlignVertical: 'top', marginBottom: 16,
  },
  editLocation: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  editLocationInput: { flex: 1, fontSize: 14, color: colors.text },
})

function PostVideoPlayer({ uri, style }: { uri: string; style: any }) {
  const player = useVideoPlayer(uri, p => { p.loop = true; p.play() })
  return <VideoView player={player} style={style} contentFit="cover" nativeControls={false} />
}

function PostMediaWithTags({ item }: { item: OwnPost }) {
  const [showTags, setShowTags] = useState(false)
  const tags = (item as any).tags as Array<{username: string, x: number, y: number}> | null
  return (
    <View style={[pv.postImage, { position: 'relative' }]}>
      {item.video_url ? (
        <PostVideoPlayer uri={item.video_url} style={StyleSheet.absoluteFill} />
      ) : item.image_url ? (
        <Image source={{ uri: item.image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient colors={['#1a2a3e', '#243a52']} style={StyleSheet.absoluteFill} />
      )}
      {tags && tags.length > 0 && (
        <Pressable style={pv.tagIconBtn} onPress={() => setShowTags(v => !v)}>
          <Text style={{ fontSize: 14, color: '#fff' }}>👤</Text>
        </Pressable>
      )}
      {showTags && tags?.map((tag, i) => (
        <View key={i} style={[pv.tagBubble, {
          left: `${tag.x * 100}%` as any,
          top: `${tag.y * 100}%` as any,
        }]}>
          <Text style={pv.tagBubbleText}>@{tag.username}</Text>
        </View>
      ))}
    </View>
  )
}

// ── Full-screen post viewer (Instagram-style) ─────────────────
function PostViewer({ posts, startId, profile, onClose, onDelete, onEdit, isSavedViewer, onUnsave }: {
  posts: OwnPost[]
  startId: string
  profile: ProfileData
  onClose: () => void
  onDelete: (id: string) => void
  onEdit?: (id: string, content: string, location: string) => void
  isSavedViewer?: boolean
  onUnsave?: (id: string) => void
}) {
  const router = useRouter()
  const startIndex = Math.max(0, posts.findIndex(p => p.id === startId))
  const listRef = useRef<FlatList>(null)
  const [listHeight, setListHeight] = useState(screenHeight - 102)
  const avatarUri = profile.feed_avatar_url ?? profile.profile_image_url
  const displayName = profile.feed_name || profile.name || ''

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={pv.root}>
        {/* Close bar */}
        <View style={pv.topBar}>
          <Pressable onPress={onClose} style={pv.backBtn}>
            <Text style={pv.backText}>‹</Text>
          </Pressable>
          <Text style={pv.topBarTitle}>Beiträge</Text>
          <View style={{ width: 36 }} />
        </View>

        <FlatList
          ref={listRef}
          data={posts}
          keyExtractor={p => p.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height
            setListHeight(h)
            if (startIndex > 0) listRef.current?.scrollToIndex({ index: startIndex, animated: false })
          }}
          getItemLayout={(_, index) => ({ length: listHeight, offset: listHeight * index, index })}
          renderItem={({ item }) => (
            <View style={[pv.card, { height: listHeight }]}>
              {/* Author row — immer oben */}
              <View style={pv.authorRow}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={pv.avatar} />
                ) : (
                  <LinearGradient colors={gradients.brand} style={pv.avatarFallback}>
                    <Text style={pv.avatarInitial}>{(displayName || '?').charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                )}
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={pv.authorName}>{displayName}</Text>
                  <Text style={pv.metaText}>
                    {item.location ? `📍 ${item.location}` : timeAgo(item.created_at)}
                  </Text>
                </View>
                <Pressable style={pv.moreBtn} onPress={() =>
                  isSavedViewer
                    ? Alert.alert('Gespeicherter Beitrag', '', [
                        { text: '🔖 Gespeichert entfernen', onPress: () => onUnsave?.(item.id) },
                        { text: 'Abbrechen', style: 'cancel' },
                      ])
                    : Alert.alert('Beitrag', '', [
                        { text: 'Bearbeiten', onPress: () => onEdit?.(item.id, item.content ?? '', item.location ?? '') },
                        { text: 'Insights anzeigen', onPress: () => router.push(`/post-insights/${item.id}` as any) },
                        { text: 'Archivieren', onPress: async () => {
                          await supabase.from('posts').update({ archived: true }).eq('id', item.id)
                          onDelete(item.id)
                        }},
                        { text: 'Löschen', style: 'destructive', onPress: () => onDelete(item.id) },
                        { text: 'Abbrechen', style: 'cancel' },
                      ])
                }>
                  <Text style={pv.moreBtnText}>•••</Text>
                </Pressable>
              </View>

              {/* Bild / Video — füllt den restlichen Platz */}
              <PostMediaWithTags item={item} />

              {/* Buttons + Info — immer unten */}
              <View style={pv.bottomBar}>
                {/* Action buttons */}
                <View style={pv.actions}>
                  <Text style={pv.actionIcon}>♡</Text>
                  <Text style={pv.actionIcon}>💬</Text>
                  <Text style={pv.actionIcon}>↗</Text>
                </View>

                {/* Gefällt-mir Zeile */}
                {item.like_count > 0 && (
                  <Text style={pv.likesCount}>
                    {'Gefällt '}
                    <Text style={pv.likesName}>{displayName}</Text>
                    {item.like_count > 1
                      ? ` und ${item.like_count - 1} ${item.like_count - 1 === 1 ? 'weiterem' : 'weiteren'}`
                      : ''}
                  </Text>
                )}

                {/* Beschreibung */}
                {item.content ? (
                  <View style={pv.captionRow}>
                    <Text style={pv.captionAuthor}>{displayName} </Text>
                    <Text style={pv.captionText}>{item.content}</Text>
                  </View>
                ) : null}

                <Text style={pv.timeText}>{timeAgo(item.created_at)}</Text>
              </View>
            </View>
          )}
        />
      </View>
    </Modal>
  )
}
const pv = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: 12,
    backgroundColor: '#000',
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  backBtn: { width: 36, justifyContent: 'center' },
  backText: { fontSize: 28, color: '#fff', fontWeight: '300' },
  topBarTitle: { fontSize: 16, fontWeight: '900', color: '#fff' },
  card: { width, flexDirection: 'column', backgroundColor: colors.background },
  authorRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: 12,
    backgroundColor: colors.background,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: colors.primary },
  avatarFallback: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontWeight: '900', fontSize: 16 },
  authorName: { fontSize: 14, fontWeight: '800', color: colors.text },
  metaText: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  moreBtn: { padding: 6 },
  moreBtnText: { color: colors.textMuted, fontSize: 20, letterSpacing: 1 },
  postImage: { width: '100%', flex: 1, maxHeight: '68%' },
  tagIconBtn: {
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  tagBubble: {
    position: 'absolute', transform: [{ translateX: -40 }, { translateY: -14 }],
    backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  tagBubbleText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  bottomBar: {
    backgroundColor: colors.background,
    paddingBottom: 16,
  },
  actions: {
    flexDirection: 'row', gap: 18,
    paddingHorizontal: spacing.lg, paddingTop: 10, paddingBottom: 6,
  },
  actionIcon: { fontSize: 28, color: colors.text },
  likesCount: { fontSize: 13, fontWeight: '600', color: colors.text, paddingHorizontal: spacing.lg, marginBottom: 4 },
  likesName: { fontWeight: '900', color: colors.text },
  captionRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, marginBottom: 4 },
  captionAuthor: { fontSize: 13, fontWeight: '800', color: colors.text },
  captionText: { fontSize: 13, color: colors.text, lineHeight: 19 },
  timeText: { fontSize: 11, color: colors.textMuted, paddingHorizontal: spacing.lg, paddingTop: 2 },
})
