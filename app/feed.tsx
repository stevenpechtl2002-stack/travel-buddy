import SceneBackground from '@/src/components/SceneBackground'
import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { FeedPost, useFeed } from '@/src/hooks/useFeed'
import { supabase } from '@/src/lib/supabase'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
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

// ── Post card ─────────────────────────────────────────────────
function PostCard({ post, currentUserId, onLike, onRepost, onDelete }: {
  post: FeedPost
  currentUserId: string
  onLike: () => void
  onRepost: () => void
  onDelete: () => void
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

  return (
    <View style={styles.card}>
      {isRepost && (
        <View style={styles.repostBanner}>
          <Text style={styles.repostBannerText}>↩ {author?.name ?? 'Jemand'} hat geteilt</Text>
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

      {displayPost.content ? (
        <Text style={styles.content}>{displayPost.content}</Text>
      ) : null}

      {displayPost.image_url ? (
        <Image source={{ uri: displayPost.image_url }} style={styles.postImage} resizeMode="cover" />
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        {/* Like */}
        <Pressable style={styles.actionBtn} onPress={handleLike}>
          <Animated.Text style={[styles.actionIcon, { transform: [{ scale: likeAnim }] },
            post.liked_by_me && { color: '#e05555' }]}>
            {post.liked_by_me ? '♥' : '♡'}
          </Animated.Text>
          <Text style={[styles.actionCount, post.liked_by_me && { color: '#e05555' }]}>
            {post.like_count > 0 ? post.like_count : ''}
          </Text>
        </Pressable>

        {/* Repost */}
        <Pressable style={styles.actionBtn} onPress={onRepost}>
          <Text style={[styles.actionIcon, post.reposted_by_me && { color: colors.primary }]}>↩</Text>
          <Text style={[styles.actionCount, post.reposted_by_me && { color: colors.primary }]}>
            {post.repost_count > 0 ? post.repost_count : ''}
          </Text>
        </Pressable>

        {/* Comment placeholder */}
        <Pressable style={styles.actionBtn}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{post.comment_count > 0 ? post.comment_count : ''}</Text>
        </Pressable>
      </View>
    </View>
  )
}

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
  const router = useRouter()
  const [composeVisible, setComposeVisible] = useState(false)

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
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)}
              tintColor={colors.primary} colors={[colors.primary]} />
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

  // Feed
  feed: { paddingVertical: 8, paddingBottom: 100 },

  // Post card
  card: {
    backgroundColor: colors.surface, marginHorizontal: spacing.md, marginBottom: 12,
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
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

  // FAB
  fab: { position: 'absolute', bottom: 32, right: 24, borderRadius: 28, overflow: 'hidden',
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
