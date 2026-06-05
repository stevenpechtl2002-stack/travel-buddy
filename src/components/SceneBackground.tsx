import { LinearGradient } from 'expo-linear-gradient'
import { ReactNode, useEffect } from 'react'
import { Dimensions, StyleSheet, View } from 'react-native'
import Animated, {
  Easing, SharedValue, useAnimatedStyle, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated'

const W = Dimensions.get('window').width
const OFFSCREEN = 60
const TOTAL = W + OFFSCREEN * 2
const SPEED = 55000

interface Props { children: ReactNode }

// Wispy cloud shape via View layers instead of emoji
function WispyCloud({ top, width, opacity, blur, startX, clock }: {
  top: number; width: number; opacity: number; blur?: number; startX: number; clock: SharedValue<number>
}) {
  const style = useAnimatedStyle(() => {
    const offset = (startX + OFFSCREEN) / TOTAL
    const t = 1 - ((offset + clock.value / SPEED) % 1)
    return { transform: [{ translateX: -OFFSCREEN + t * TOTAL }] }
  })
  return (
    <Animated.View style={[{ position: 'absolute', top, opacity }, style]}>
      {/* Main cloud body */}
      <View style={{
        width, height: width * 0.28, borderRadius: width * 0.14,
        backgroundColor: 'rgba(240,220,200,0.55)',
      }} />
      {/* Top puff left */}
      <View style={{
        position: 'absolute', width: width * 0.45, height: width * 0.45,
        borderRadius: width * 0.225, backgroundColor: 'rgba(240,215,195,0.45)',
        top: -width * 0.22, left: width * 0.1,
      }} />
      {/* Top puff right */}
      <View style={{
        position: 'absolute', width: width * 0.38, height: width * 0.38,
        borderRadius: width * 0.19, backgroundColor: 'rgba(240,215,195,0.4)',
        top: -width * 0.18, left: width * 0.4,
      }} />
    </Animated.View>
  )
}

const CLOUDS = [
  { top: 55,  width: 110, opacity: 0.55, startX: TOTAL * 0.02 - OFFSCREEN },
  { top: 72,  width: 68,  opacity: 0.35, startX: TOTAL * 0.21 - OFFSCREEN },
  { top: 48,  width: 95,  opacity: 0.48, startX: TOTAL * 0.40 - OFFSCREEN },
  { top: 82,  width: 78,  opacity: 0.38, startX: TOTAL * 0.58 - OFFSCREEN },
  { top: 60,  width: 105, opacity: 0.50, startX: TOTAL * 0.74 - OFFSCREEN },
  { top: 75,  width: 62,  opacity: 0.32, startX: TOTAL * 0.88 - OFFSCREEN },

  { top: 108, width: 88,  opacity: 0.38, startX: TOTAL * 0.12 - OFFSCREEN },
  { top: 120, width: 55,  opacity: 0.28, startX: TOTAL * 0.32 - OFFSCREEN },
  { top: 100, width: 98,  opacity: 0.42, startX: TOTAL * 0.52 - OFFSCREEN },
  { top: 115, width: 72,  opacity: 0.33, startX: TOTAL * 0.70 - OFFSCREEN },
  { top: 105, width: 82,  opacity: 0.36, startX: TOTAL * 0.86 - OFFSCREEN },
]

export default function SceneBackground({ children }: Props) {
  const clock = useSharedValue(0)

  useEffect(() => {
    clock.value = withRepeat(
      withTiming(SPEED, { duration: SPEED, easing: Easing.linear }),
      -1, false
    )
  }, [])

  return (
    <View style={styles.root}>
      {/* Golden-hour sky: deep midnight blue → warm horizon glow */}
      <LinearGradient
        colors={['#0d1b2e', '#1a3a5c', '#7e4a35', '#c4703a', '#e8a860']}
        locations={[0, 0.3, 0.55, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Subtle star shimmer in the dark upper area */}
      <View style={styles.stars} />
      {CLOUDS.map((c, i) => (
        <WispyCloud key={i} {...c} clock={clock} />
      ))}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stars: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 120,
    opacity: 0.3,
    // stars are painted via the gradient — placeholder for possible future Lottie/SVG
  },
})
