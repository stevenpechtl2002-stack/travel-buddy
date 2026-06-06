import { colors, gradients, radius, spacing } from '../constants/theme'
import { Profile, TravelDestination, UserInterest } from '../types'
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native'

const RELIGION_ICONS: Record<string, string> = {
  'Christlich': '✝️',
  'Islamisch': '☪️',
  'Hinduistisch': '🕉',
  'Buddhistisch': '☸️',
  'Jüdisch': '✡️',
  'Andere': '🌍',
  'Keine': '⚪',
}

const DEMO_IMAGES: Record<string, any> = {
  'demo-1':  require('../../assets/demo/laura.jpg'),
  'demo-2':  require('../../assets/demo/max.jpg'),
  'demo-3':  require('../../assets/demo/sofia.jpg'),
  'demo-4':  require('../../assets/demo/jonas.jpg'),
  'demo-5':  require('../../assets/demo/mia.jpg'),
  'demo-6':  require('../../assets/demo/luca.jpg'),
  'demo-7':  require('../../assets/demo/emma.jpg'),
  'demo-8':  require('../../assets/demo/noah.jpg'),
  'demo-9':  require('../../assets/demo/yuki.jpg'),
  'demo-10': require('../../assets/demo/ali.jpg'),
  'demo-11': require('../../assets/demo/chloe.jpg'),
  'demo-12': require('../../assets/demo/finn.jpg'),
  'demo-13': require('../../assets/demo/amara.jpg'),
  'demo-14': require('../../assets/demo/carlos.jpg'),
  'demo-15': require('../../assets/demo/anna.jpg'),
  'demo-16': require('../../assets/demo/ben.jpg'),
  'demo-17': require('../../assets/demo/priya.jpg'),
}

const FALLBACK_IMAGES = [
  require('../../assets/demo/laura.jpg'),
  require('../../assets/demo/max.jpg'),
  require('../../assets/demo/sofia.jpg'),
  require('../../assets/demo/jonas.jpg'),
  require('../../assets/demo/mia.jpg'),
  require('../../assets/demo/luca.jpg'),
  require('../../assets/demo/emma.jpg'),
  require('../../assets/demo/noah.jpg'),
]

function getFallbackImage(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return FALLBACK_IMAGES[Math.abs(hash) % FALLBACK_IMAGES.length]
}
import { LinearGradient } from 'expo-linear-gradient'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import { forwardRef, useImperativeHandle, useState, useCallback } from 'react'
import ProfileDetailModal from './ProfileDetailModal'

const { width, height } = Dimensions.get('window')
const CARD_WIDTH = width - spacing.lg * 2
const CARD_HEIGHT = height * 0.64
const SWIPE_THRESHOLD = width * 0.3

export interface SwipeCardRef {
  triggerSwipe: (direction: 'left' | 'right') => void
}

interface Props {
  profile: Profile
  destinations: TravelDestination[]
  interests: UserInterest[]
  onSwipeLeft: () => void
  onSwipeRight: () => void
}

const SwipeCard = forwardRef<SwipeCardRef, Props>(function SwipeCard(
  { profile, destinations, interests, onSwipeLeft, onSwipeRight },
  ref
) {
  const topInterests = interests.slice(0, 4).map(i => i.interest)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const [detailVisible, setDetailVisible] = useState(false)
  const [imgError, setImgError] = useState(false)

  useImperativeHandle(ref, () => ({
    triggerSwipe(direction: 'left' | 'right') {
      const targetX = direction === 'right' ? width * 1.5 : -width * 1.5
      translateX.value = withTiming(targetX, { duration: 350 }, () => {
        runOnJS(direction === 'right' ? onSwipeRight : onSwipeLeft)()
      })
      translateY.value = withTiming(-30, { duration: 350 })
    },
  }))

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX
      translateY.value = e.translationY * 0.3
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(width * 1.5, { duration: 300 }, () => {
          runOnJS(onSwipeRight)()
        })
        translateY.value = withTiming(e.translationY, { duration: 300 })
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-width * 1.5, { duration: 300 }, () => {
          runOnJS(onSwipeLeft)()
        })
        translateY.value = withTiming(e.translationY, { duration: 300 })
      } else {
        translateX.value = withSpring(0, { damping: 15 })
        translateY.value = withSpring(0, { damping: 15 })
      }
    })

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-width / 2, 0, width / 2],
      [-15, 0, 15],
      Extrapolation.CLAMP
    )
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    }
  })

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }))

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }))

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        {DEMO_IMAGES[profile.id] ? (
          <Image source={DEMO_IMAGES[profile.id]} style={styles.photo} resizeMode="cover" />
        ) : profile.profile_image_url && !imgError ? (
          <Image source={{ uri: profile.profile_image_url }} style={styles.photo} resizeMode="cover" onError={() => setImgError(true)} />
        ) : (
          <Image source={getFallbackImage(profile.id)} style={styles.photo} resizeMode="cover" />
        )}

        <Animated.View style={[styles.likeLabel, likeOpacity]}>
          <Text style={styles.likeLabelText}>LIKE ♥</Text>
        </Animated.View>

        <Animated.View style={[styles.nopeLabel, nopeOpacity]}>
          <Text style={styles.nopeLabelText}>NOPE ✕</Text>
        </Animated.View>

        {/* Details button */}
        <Pressable style={styles.infoBtn} onPress={() => setDetailVisible(true)}>
          <LinearGradient colors={['rgba(0,0,0,0.65)', 'rgba(0,0,0,0.45)']} style={styles.infoBtnGrad}>
            <Text style={styles.infoBtnText}>Details</Text>
          </LinearGradient>
        </Pressable>

        <ProfileDetailModal
          visible={detailVisible}
          profile={profile}
          destinations={destinations}
          interests={interests}
          onClose={() => setDetailVisible(false)}
          onSwipeLeft={() => { setDetailVisible(false); onSwipeLeft() }}
          onSwipeRight={() => { setDetailVisible(false); onSwipeRight() }}
        />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.overlay}
        >
          {/* Name + Religion icon */}
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.name}, {profile.age}</Text>
            {profile.religion ? (
              <View style={styles.religionBadge}>
                <Text style={styles.religionIcon}>{RELIGION_ICONS[profile.religion] ?? '🌍'}</Text>
              </View>
            ) : null}
          </View>

          {/* Tagline */}
          {profile.tagline ? <Text style={styles.tagline}>{profile.tagline}</Text> : null}

          {destinations.length > 0 && (
            <View style={styles.destinations}>
              {destinations.slice(0, 3).map(d => (
                <View key={d.id} style={styles.destChip}>
                  <Text style={styles.destText}>🌍 {d.city ?? d.country}</Text>
                </View>
              ))}
            </View>
          )}

          {topInterests.length > 0 && (
            <View style={styles.interests}>
              {topInterests.map(interest => (
                <View key={interest} style={styles.interestChip}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          )}

          {profile.bio ? <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text> : null}
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  )
})

export default SwipeCard

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: spacing.lg,
    paddingTop: spacing.xl * 2,
  },
  likeLabel: {
    position: 'absolute', top: 40, left: 20,
    borderWidth: 4, borderColor: '#4CAF50', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    transform: [{ rotate: '-20deg' }],
  },
  likeLabelText: { fontSize: 28, fontWeight: '900', color: '#4CAF50', letterSpacing: 2 },
  nopeLabel: {
    position: 'absolute', top: 40, right: 20,
    borderWidth: 4, borderColor: '#F44336', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    transform: [{ rotate: '20deg' }],
  },
  nopeLabelText: { fontSize: 28, fontWeight: '900', color: '#F44336', letterSpacing: 2 },
  name: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  destinations: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  destChip: { backgroundColor: 'rgba(232,132,92,0.85)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  destText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  interestChip: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  interestText: { color: '#fff', fontSize: 12 },
  bio: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  religionBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  religionIcon: { fontSize: 16 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', marginBottom: 6 },
  infoBtn: { position: 'absolute', top: 14, right: 14, borderRadius: 20, overflow: 'hidden' },
  infoBtnGrad: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  infoBtnText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
})
