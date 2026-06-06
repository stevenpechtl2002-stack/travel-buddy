import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { FeedPost } from '@/src/hooks/useFeed'
import { supabase } from '@/src/lib/supabase'
import * as FileSystem from 'expo-file-system/legacy'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  ActionSheetIOS, ActivityIndicator, Alert, Animated,
  Dimensions, FlatList, Image, KeyboardAvoidingView, Modal,
  Platform, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native'

const { width } = Dimensions.get('window')
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
}

// ── Bottom nav ────────────────────────────────────────────────
function FeedProfileTabBar() {
  const router = useRouter()
  const tabs = [
    { key: 'home',    icon: '⌂',  label: 'Home',    route: '/feed' },
    { key: 'chat',    icon: '💬', label: 'Chat',    route: '/chats' },
    { key: 'search',  icon: '⊙',  label: 'Suchen',  route: '/explore' },
    { key: 'profile', icon: '◯',  label: 'Profil',  route: '/feed-profile' },
  ] as const
  return (
    <View style={navS.wrapper}>
      <View style={navS.glow} />
      {tabs.map(tab => {
        const active = tab.key === 'profile'
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
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)

  const reset = () => { setText(''); setLocation(''); setImageUri(null) }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.85 })
    if (!res.canceled) setImageUri(res.assets[0].uri)
  }

  const uploadImage = async (uri: string): Promise<string> => {
    const ext = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? 'jpg'
    const fname = `feed/${userId}/${Date.now()}.${ext}`
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
    if (!text.trim() && !imageUri) { Alert.alert('', 'Text oder Bild eingeben'); return }
    setPosting(true)
    try {
      let imgUrl: string | null = null
      if (imageUri) imgUrl = await uploadImage(imageUri)
      await supabase.from('posts').insert({
        user_id: userId,
        content: text.trim() || null,
        image_url: imgUrl,
        location: location.trim() || null,
        type: 'post',
        like_count: 0, repost_count: 0, comment_count: 0,
      })
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
            {imageUri && type !== 'thread' && (
              <View style={{ position: 'relative', marginBottom: 12 }}>
                <Image source={{ uri: imageUri }} style={cs.imgPreview} resizeMode="cover" />
                <Pressable style={cs.removeImg} onPress={() => setImageUri(null)}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>✕</Text>
                </Pressable>
              </View>
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
              <Pressable style={cs.toolbarBtn} onPress={pickImage}>
                <Text style={cs.toolbarIcon}>🖼</Text>
                <Text style={cs.toolbarLabel}>Foto</Text>
              </Pressable>
              <Text style={cs.charCount}>{text.length}/500</Text>
            </View>
          )}
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
})

// ── Main screen ───────────────────────────────────────────────
export default function FeedProfileScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const router = useRouter()

  const [profile, setProfile] = useState<ProfileData>({ name: '', bio: null, profile_image_url: null, country: null })
  const [stats, setStats] = useState<ProfileStats>({ postCount: 0, followerCount: 0, followingCount: 0 })
  const [posts, setPosts] = useState<OwnPost[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<'grid' | 'threads'>('grid')
  const [composeType, setComposeType] = useState<'post' | 'thread'>('post')
  const [composeVisible, setComposeVisible] = useState(false)
  const tabAnim = useRef(new Animated.Value(0)).current

  const load = async () => {
    if (!userId) return
    const [profileRes, postsRes, followersRes, followingRes] = await Promise.all([
      supabase.from('profiles').select('name, bio, profile_image_url, country').eq('id', userId).single(),
      supabase.from('posts')
        .select('id, user_id, content, image_url, location, type, repost_of, like_count, repost_count, comment_count, created_at, author:profiles!posts_user_id_fkey(name, profile_image_url)')
        .eq('user_id', userId).eq('type', 'post')
        .order('created_at', { ascending: false }),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
    ])
    if (profileRes.data) setProfile(profileRes.data)
    const allPosts: OwnPost[] = (postsRes.data ?? []).map((p: any) => ({
      ...p, author: Array.isArray(p.author) ? p.author[0] : p.author,
      liked_by_me: false, reposted_by_me: false,
    }))
    setPosts(allPosts)
    setStats({
      postCount: allPosts.length,
      followerCount: followersRes.count ?? 0,
      followingCount: followingRes.count ?? 0,
    })
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load() }, [userId])

  const doRefresh = () => { setRefreshing(true); load() }

  const openCompose = (type: 'post' | 'thread') => { setComposeType(type); setComposeVisible(true) }

  const handleDelete = (postId: string) => {
    ActionSheetIOS.showActionSheetWithOptions(
      { options: ['Post löschen', 'Abbrechen'], destructiveButtonIndex: 0, cancelButtonIndex: 1 },
      async idx => {
        if (idx === 0) {
          await supabase.from('posts').delete().eq('id', postId)
          setPosts(prev => prev.filter(p => p.id !== postId))
          setStats(prev => ({ ...prev, postCount: prev.postCount - 1 }))
        }
      }
    )
  }

  const imagePosts = posts.filter(p => p.image_url)
  const threadPosts = posts.filter(p => !p.image_url && p.content)

  // ── Header component
  function ProfileHeader() {
    return (
      <View style={styles.profileHeader}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          {profile.profile_image_url ? (
            <Image source={{ uri: profile.profile_image_url }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={gradients.brand} style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{(profile.name || '?').charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          )}
        </View>

        {/* Stats row */}
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

        {/* Name + bio */}
        <View style={styles.bioSection}>
          <Text style={styles.profileName}>{profile.name || 'Dein Profil'}</Text>
          {profile.country ? <Text style={styles.profileCountry}>📍 {profile.country}</Text> : null}
          {profile.bio ? <Text style={styles.profileBio}>{profile.bio}</Text> : null}
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <Pressable style={styles.editBtn} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.editBtnText}>Profil bearbeiten</Text>
          </Pressable>
          <Pressable style={styles.shareBtn}>
            <Text style={styles.shareBtnText}>↗</Text>
          </Pressable>
        </View>

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
        </View>
      </View>
    )
  }

  // ── Grid cell
  function GridCell({ post }: { post: OwnPost }) {
    return (
      <Pressable style={styles.cell} onLongPress={() => handleDelete(post.id)}>
        {post.image_url
          ? <Image source={{ uri: post.image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <LinearGradient colors={['#1a2a3e', '#243a52']} style={StyleSheet.absoluteFill} />}
        <View style={styles.cellOverlay}>
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

  const displayData = tab === 'grid' ? imagePosts : threadPosts

  return (
    <View style={styles.root}>
      {/* Back / header */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.push('/feed')} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>{profile.name || 'Profil'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={tab === 'grid' ? imagePosts : threadPosts}
        keyExtractor={p => p.id}
        numColumns={tab === 'grid' ? 3 : 1}
        key={tab}    // force re-render on tab change (numColumns switch)
        contentContainerStyle={styles.list}
        columnWrapperStyle={tab === 'grid' ? { gap: 1.5 } : undefined}
        ItemSeparatorComponent={tab === 'grid' ? () => <View style={{ height: 1.5 }} /> : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={<ProfileHeader />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>{tab === 'grid' ? '🖼' : '💬'}</Text>
            <Text style={styles.emptyText}>
              {tab === 'grid' ? 'Noch keine Bilder gepostet' : 'Noch keine Threads'}
            </Text>
            <Pressable style={{ borderRadius: 50, overflow: 'hidden', marginTop: 16 }}
              onPress={() => openCompose(tab === 'grid' ? 'post' : 'thread')}>
              <LinearGradient colors={gradients.brand} style={{ paddingHorizontal: 24, paddingVertical: 12 }}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>
                  {tab === 'grid' ? 'Ersten Post erstellen' : 'Ersten Thread erstellen'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => tab === 'grid' ? <GridCell post={item} /> : <ThreadCard post={item} />}
      />

      <FeedProfileTabBar />

      <ComposeModal
        visible={composeVisible}
        userId={userId}
        type={composeType}
        onClose={() => setComposeVisible(false)}
        onDone={(goToFeed) => { load(); if (goToFeed) router.push('/feed') }}
      />
    </View>
  )
}

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

  list: { paddingBottom: 120 },

  // Profile header
  profileHeader: { paddingBottom: 4 },
  avatarSection: { paddingHorizontal: spacing.lg, paddingTop: 20, paddingBottom: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 2.5, borderColor: colors.primary },
  avatarFallback: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 36, color: '#fff', fontWeight: '900' },

  statsRow: {
    flexDirection: 'row', paddingHorizontal: spacing.lg,
    gap: 28, marginBottom: 12,
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
})
