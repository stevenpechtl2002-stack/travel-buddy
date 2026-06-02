import { colors, radius, spacing } from '../constants/theme'
import { Profile, TravelDestination, UserInterest } from '../types'
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native'
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

const { width, height } = Dimensions.get('window')
const CARD_WIDTH = width - spacing.lg * 2
const CARD_HEIGHT = height * 0.72
const SWIPE_THRESHOLD = width * 0.3

interface Props {
  profile: Profile
  destinations: TravelDestination[]
  interests: UserInterest[]
  onSwipeLeft: () => void
  onSwipeRight: () => void
}

export default function SwipeCard({ profile, destinations, interests, onSwipeLeft, onSwipeRight }: Props) {
  const topInterests = interests.slice(0, 4).map(i => i.interest)

  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)

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
        {profile.profile_image_url ? (
          <Image source={{ uri: profile.profile_image_url }} style={styles.photo} resizeMode="cover" />
        ) : (
          <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.photo}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </LinearGradient>
        )}

        {/* LIKE label */}
        <Animated.View style={[styles.likeLabel, likeOpacity]}>
          <Text style={styles.likeLabelText}>LIKE ♥</Text>
        </Animated.View>

        {/* NOPE label */}
        <Animated.View style={[styles.nopeLabel, nopeOpacity]}>
          <Text style={styles.nopeLabelText}>NOPE ✕</Text>
        </Animated.View>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={styles.overlay}
        >
          <Text style={styles.name}>{profile.name}, {profile.age}</Text>

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
}

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
  avatarEmoji: { fontSize: 80 },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingTop: spacing.xl * 2,
  },
  likeLabel: {
    position: 'absolute',
    top: 40,
    left: 20,
    borderWidth: 4,
    borderColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    transform: [{ rotate: '-20deg' }],
  },
  likeLabelText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#4CAF50',
    letterSpacing: 2,
  },
  nopeLabel: {
    position: 'absolute',
    top: 40,
    right: 20,
    borderWidth: 4,
    borderColor: '#F44336',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    transform: [{ rotate: '20deg' }],
  },
  nopeLabelText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F44336',
    letterSpacing: 2,
  },
  name: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: spacing.sm },
  destinations: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  destChip: {
    backgroundColor: 'rgba(247,151,30,0.85)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  destText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  interestChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  interestText: { color: '#fff', fontSize: 12 },
  bio: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' },
})
