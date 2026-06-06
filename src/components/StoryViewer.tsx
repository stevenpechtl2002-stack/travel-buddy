import { colors } from '../constants/theme'
import { StoryGroup } from '../hooks/useStories'
import { useEffect, useRef, useState } from 'react'
import {
  Animated, Dimensions, Image, Modal, Pressable,
  StyleSheet, Text, View, StatusBar,
} from 'react-native'

const { width, height } = Dimensions.get('window')
const STORY_DURATION = 5000  // ms per story

interface Props {
  groups: StoryGroup[]
  startGroupIndex: number
  visible: boolean
  onClose: () => void
  onSeen: (ids: string[]) => void
}

export default function StoryViewer({ groups, startGroupIndex, visible, onClose, onSeen }: Props) {
  const [groupIdx, setGroupIdx] = useState(startGroupIndex)
  const [storyIdx, setStoryIdx] = useState(0)
  const progressAnim = useRef(new Animated.Value(0)).current
  const progressRef = useRef<Animated.CompositeAnimation | null>(null)
  const pausedRef = useRef(false)

  const group = groups[groupIdx]
  const story = group?.stories[storyIdx]

  useEffect(() => {
    if (!visible || !story) return
    startProgress()
    onSeen([story.id])
    return () => progressRef.current?.stop()
  }, [groupIdx, storyIdx, visible])

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
    if (storyIdx > 0) {
      setStoryIdx(i => i - 1)
    } else if (groupIdx > 0) {
      setGroupIdx(i => i - 1)
      setStoryIdx(0)
    }
  }

  if (!group || !story) return null

  const timeAgo = (iso: string) => {
    const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
    if (h < 1) return 'gerade eben'
    return `vor ${h} Std`
  }

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar hidden />
      <View style={styles.root}>
        {/* Background image */}
        <Image source={{ uri: story.image_url }} style={styles.bg} resizeMode="cover" />

        {/* Dark gradient overlay top */}
        <View style={styles.topGradient} />
        {/* Dark gradient overlay bottom */}
        <View style={styles.bottomGradient} />

        {/* Progress bars */}
        <View style={styles.progressRow}>
          {group.stories.map((s, i) => (
            <View key={s.id} style={styles.progressTrack}>
              <Animated.View style={[
                styles.progressFill,
                {
                  width: i < storyIdx
                    ? '100%'
                    : i === storyIdx
                      ? progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                      : '0%',
                },
              ]} />
            </View>
          ))}
        </View>

        {/* Header: avatar + name + time + close */}
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
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={16}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {/* Caption */}
        {story.caption ? (
          <View style={styles.captionWrap}>
            <Text style={styles.caption}>{story.caption}</Text>
          </View>
        ) : null}

        {/* Tap zones: left = prev, right = next */}
        <Pressable style={styles.tapLeft} onPress={goPrev} />
        <Pressable style={styles.tapRight} onPress={goNext} />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  topGradient: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 180,
    backgroundColor: 'transparent',
    // Simulated gradient via opacity
    backgroundGradient: 'rgba(0,0,0,0.6)',
  },
  bottomGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
  },

  // Progress
  progressRow: {
    flexDirection: 'row', gap: 4,
    position: 'absolute', top: 52, left: 12, right: 12, zIndex: 10,
  },
  progressTrack: {
    flex: 1, height: 2.5, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },

  // Header
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

  // Caption
  captionWrap: {
    position: 'absolute', bottom: 50, left: 16, right: 16, zIndex: 10,
  },
  caption: {
    color: '#fff', fontSize: 15, fontWeight: '600', lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },

  // Tap zones
  tapLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: width * 0.38, zIndex: 5 },
  tapRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: width * 0.62, zIndex: 5 },
})
