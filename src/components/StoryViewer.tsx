import { colors } from '../constants/theme'
import { StoryGroup } from '../hooks/useStories'
import { useEffect, useRef, useState } from 'react'
import {
  Alert, Animated, Dimensions, Image, Modal, Pressable,
  StyleSheet, Text, View, StatusBar, FlatList, ActivityIndicator,
} from 'react-native'
import { VideoView, useVideoPlayer } from 'expo-video'
import { supabase } from '../lib/supabase'

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '👏', '🔥']

const { width, height } = Dimensions.get('window')
const STORY_DURATION = 5000

interface Viewer {
  id: string
  name: string
  profile_image_url: string | null
  viewed_at: string
}

interface Props {
  groups: StoryGroup[]
  startGroupIndex: number
  visible: boolean
  onClose: () => void
  onSeen: (ids: string[]) => void
  onDelete?: (storyId: string) => void
  onAddToHighlight?: (storyId: string, imageUrl: string, mediaType: 'image' | 'video') => void
  isOwner?: boolean
  userId?: string
}

function VideoStoryBackground({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, p => { p.loop = true; p.play() })
  return (
    <VideoView
      player={player}
      style={[styles.bg, { zIndex: 0 }]}
      contentFit="cover"
      nativeControls={false}
    />
  )
}

export default function StoryViewer({ groups, startGroupIndex, visible, onClose, onSeen, onDelete, onAddToHighlight, isOwner: isOwnerProp, userId }: Props) {
  const [groupIdx, setGroupIdx] = useState(startGroupIndex)
  const [storyIdx, setStoryIdx] = useState(0)
  const progressAnim = useRef(new Animated.Value(0)).current
  const progressRef = useRef<Animated.CompositeAnimation | null>(null)
  const pausedRef = useRef(false)
  const [showViewers, setShowViewers] = useState(false)
  const [viewers, setViewers] = useState<Viewer[]>([])
  const [viewersLoading, setViewersLoading] = useState(false)
  const slideAnim = useRef(new Animated.Value(height)).current
  const [sentReaction, setSentReaction] = useState<string | null>(null)
  const reactionAnim = useRef(new Animated.Value(0)).current

  const group = groups[groupIdx]
  const story = group?.stories[storyIdx]
  const isOwner = isOwnerProp ?? group?.isMe ?? false

  const handleDelete = () => {
    if (!story || !onDelete) return
    progressRef.current?.stop()
    Alert.alert('Story löschen?', 'Diese Story wird dauerhaft entfernt.', [
      { text: 'Löschen', style: 'destructive', onPress: () => { onDelete(story.id); onClose() } },
      { text: 'Abbrechen', style: 'cancel', onPress: () => startProgress() },
    ])
  }

  const handleReact = async (emoji: string) => {
    if (!story || !userId) return
    setSentReaction(emoji)
    reactionAnim.setValue(0)
    Animated.sequence([
      Animated.timing(reactionAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(800),
      Animated.timing(reactionAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setSentReaction(null))
    // Send as notification to story owner (skip self-reactions)
    if (story.user_id !== userId) {
      await supabase.from('notifications').insert({
        user_id: story.user_id,
        actor_id: userId,
        type: 'like',
        post_id: null,
        read: false,
      }).then()
    }
  }

  useEffect(() => {
    if (!visible || !story) return
    startProgress()
    onSeen([story.id])
    return () => progressRef.current?.stop()
  }, [groupIdx, storyIdx, visible])

  useEffect(() => {
    if (showViewers) {
      pausedRef.current = true
      progressRef.current?.stop()
      loadViewers()
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start()
    } else {
      Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }).start(() => {
        pausedRef.current = false
        startProgress()
      })
    }
  }, [showViewers])

  const loadViewers = async () => {
    if (!story) return
    setViewersLoading(true)
    const { data } = await supabase
      .from('story_views')
      .select('viewer_id, viewed_at, viewer:profiles!story_views_viewer_id_fkey(name, profile_image_url)')
      .eq('story_id', story.id)
      .order('viewed_at', { ascending: false })
    setViewers((data ?? []).map((v: any) => ({
      id: v.viewer_id,
      name: Array.isArray(v.viewer) ? v.viewer[0]?.name : v.viewer?.name ?? 'Unbekannt',
      profile_image_url: Array.isArray(v.viewer) ? v.viewer[0]?.profile_image_url : v.viewer?.profile_image_url ?? null,
      viewed_at: v.viewed_at,
    })))
    setViewersLoading(false)
  }

  const startProgress = () => {
    progressAnim.setValue(0)
    progressRef.current?.stop()
    progressRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    })
    progressRef.current.start(({ finished }) => {
      if (finished && !pausedRef.current) goNext()
    })
  }

  const goNext = () => {
    if (storyIdx < (group?.stories.length ?? 1) - 1) {
      setStoryIdx(i => i + 1)
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(i => i + 1)
      setStoryIdx(0)
    } else {
      onClose()
    }
  }

  const goPrev = () => {
    if (storyIdx > 0) setStoryIdx(i => i - 1)
    else if (groupIdx > 0) { setGroupIdx(i => i - 1); setStoryIdx(0) }
  }

  if (!group || !story) return null

  const timeAgo = (iso: string) => {
    const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
    if (h < 1) return 'gerade eben'
    return `vor ${h} Std`
  }

  const viewerTimeAgo = (iso: string) => {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (m < 1) return 'gerade eben'
    if (m < 60) return `vor ${m} Min`
    return `vor ${Math.floor(m / 60)} Std`
  }

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar hidden />
      <View style={styles.root}>
        {/* Background — portrait format */}
        {story.media_type === 'video' ? (
          <VideoStoryBackground uri={story.image_url} />
        ) : (
          <Image source={{ uri: story.image_url }} style={styles.bg} resizeMode="cover" />
        )}

        {/* Gradient overlays */}
        <View style={styles.topGradient} />
        <View style={styles.bottomGradient} />

        {/* Progress bars */}
        <View style={styles.progressRow}>
          {group.stories.map((s, i) => (
            <View key={s.id} style={styles.progressTrack}>
              <Animated.View style={[
                styles.progressFill,
                {
                  width: i < storyIdx ? '100%'
                    : i === storyIdx
                      ? progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                      : '0%',
                },
              ]} />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {group.profile_image_url ? (
              <Image source={{ uri: group.profile_image_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{group.name.charAt(0)}</Text>
              </View>
            )}
            <View>
              <Text style={styles.authorName}>{group.name}</Text>
              <Text style={styles.storyTime}>{timeAgo(story.created_at)}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {isOwner && onAddToHighlight && (
              <Pressable onPress={() => onAddToHighlight(story.id, story.image_url, story.media_type)} style={styles.closeBtn} hitSlop={16}>
                <Text style={styles.closeBtnText}>⭐</Text>
              </Pressable>
            )}
            {isOwner && onDelete && (
              <Pressable onPress={handleDelete} style={styles.closeBtn} hitSlop={16}>
                <Text style={styles.closeBtnText}>🗑</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={16}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>
        </View>

        {/* Caption */}
        {story.caption ? (
          <View style={styles.captionWrap}>
            <Text style={styles.caption}>{story.caption}</Text>
          </View>
        ) : null}

        {/* Owner: "Wer hat es gesehen" button at bottom */}
        {isOwner && !showViewers && (
          <Pressable style={styles.viewersHint} onPress={() => setShowViewers(true)}>
            <Text style={styles.viewersHintIcon}>👁</Text>
            <Text style={styles.viewersHintText}>
              {story.seen_count > 0 ? `${story.seen_count} haben gesehen` : 'Noch niemand gesehen'}
            </Text>
            <Text style={styles.viewersHintArrow}>↑</Text>
          </Pressable>
        )}

        {/* Non-owner: Emoji reaction bar */}
        {!isOwner && !showViewers && (
          <View style={styles.reactionBar}>
            {REACTION_EMOJIS.map(emoji => (
              <Pressable key={emoji} style={styles.reactionBtn} onPress={() => handleReact(emoji)}>
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Reaction sent animation */}
        {sentReaction && (
          <Animated.Text style={[styles.reactionFloating, {
            opacity: reactionAnim,
            transform: [{ translateY: reactionAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) }],
          }]}>
            {sentReaction}
          </Animated.Text>
        )}

        {/* Tap zones */}
        {!showViewers && (
          <>
            <Pressable style={styles.tapLeft} onPress={goPrev} />
            <Pressable style={styles.tapRight} onPress={goNext} />
          </>
        )}

        {/* Viewers sheet */}
        {showViewers && (
          <Pressable style={styles.viewersBg} onPress={() => setShowViewers(false)} />
        )}
        <Animated.View style={[styles.viewersSheet, { transform: [{ translateY: slideAnim }] }]}>
          <Pressable style={styles.viewersHandle} onPress={() => setShowViewers(false)}>
            <View style={styles.handleBar} />
          </Pressable>
          <Text style={styles.viewersTitle}>
            👁 {story.seen_count} {story.seen_count === 1 ? 'Person' : 'Personen'} haben gesehen
          </Text>
          {viewersLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : viewers.length === 0 ? (
            <Text style={styles.viewersEmpty}>Noch niemand hat diese Story gesehen</Text>
          ) : (
            <FlatList
              data={viewers}
              keyExtractor={v => v.id}
              style={{ maxHeight: height * 0.45 }}
              renderItem={({ item }) => (
                <View style={styles.viewerRow}>
                  {item.profile_image_url ? (
                    <Image source={{ uri: item.profile_image_url }} style={styles.viewerAvatar} />
                  ) : (
                    <View style={styles.viewerAvatarFallback}>
                      <Text style={styles.viewerAvatarInitial}>{item.name.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.viewerName}>{item.name}</Text>
                    <Text style={styles.viewerTime}>{viewerTimeAgo(item.viewed_at)}</Text>
                  </View>
                </View>
              )}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bg: { position: 'absolute', top: 0, left: 0, width, height },

  topGradient: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 180,
    backgroundColor: 'transparent',
  },
  bottomGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
  },

  progressRow: {
    flexDirection: 'row', gap: 4,
    position: 'absolute', top: 52, left: 12, right: 12, zIndex: 10,
  },
  progressTrack: {
    flex: 1, height: 2.5, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },

  header: {
    position: 'absolute', top: 64, left: 12, right: 12, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: '#fff' },
  avatarFallback: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarInitial: { color: '#fff', fontWeight: '900', fontSize: 16 },
  authorName: { color: '#fff', fontWeight: '800', fontSize: 14 },
  storyTime: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  captionWrap: {
    position: 'absolute', bottom: 90, left: 16, right: 16, zIndex: 10,
  },
  caption: {
    color: '#fff', fontSize: 15, fontWeight: '600', lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },

  // Emoji reactions
  reactionBar: {
    position: 'absolute', bottom: 32, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', justifyContent: 'center', gap: 12,
  },
  reactionBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  reactionEmoji: { fontSize: 22 },
  reactionFloating: {
    position: 'absolute', bottom: 90, alignSelf: 'center',
    zIndex: 20, fontSize: 48,
  },

  // Owner viewers hint
  viewersHint: {
    position: 'absolute', bottom: 32, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  viewersHintIcon: { fontSize: 18, color: '#fff' },
  viewersHintText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  viewersHintArrow: { color: '#fff', fontSize: 16 },

  tapLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: width * 0.38, zIndex: 5 },
  tapRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: width * 0.62, zIndex: 5 },

  // Viewers sheet
  viewersBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 15 },
  viewersSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
    backgroundColor: '#111d2e',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 40,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  viewersHandle: { alignItems: 'center', paddingVertical: 12 },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  viewersTitle: { fontSize: 15, fontWeight: '800', color: '#fff', paddingHorizontal: 20, marginBottom: 16 },
  viewersEmpty: { fontSize: 14, color: 'rgba(255,255,255,0.4)', paddingHorizontal: 20, paddingTop: 20, textAlign: 'center' },
  viewerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, gap: 12 },
  viewerAvatar: { width: 44, height: 44, borderRadius: 22 },
  viewerAvatarFallback: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  viewerAvatarInitial: { color: '#fff', fontWeight: '900', fontSize: 18 },
  viewerName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  viewerTime: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
})
