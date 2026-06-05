import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View, Dimensions } from 'react-native'
import { ReactNode, useEffect } from 'react'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, SharedValue
} from 'react-native-reanimated'

const W = Dimensions.get('window').width
const OFFSCREEN = 55          // buffer so cloud fully exits before reappearing
const TOTAL = W + OFFSCREEN * 2
const SPEED = 45000

interface Props { children: ReactNode }

function Cloud({ top, size, opacity, startX, clock }: {
  top: number; size: number; opacity: number; startX: number; clock: SharedValue<number>
}) {
  const style = useAnimatedStyle(() => {
    const offset = (startX + OFFSCREEN) / TOTAL
    const t = (offset + clock.value / SPEED) % 1
    return { transform: [{ translateX: -OFFSCREEN + t * TOTAL }] }
  })
  return (
    <Animated.View style={[{ position: 'absolute', top }, style]}>
      <Text style={{ fontSize: size, opacity }}>☁️</Text>
    </Animated.View>
  )
}

// Clouds: irregular horizontal & vertical positions, no visible pattern
const CLOUDS = [
  { top: 60,  size: 50, opacity: 0.80, startX: TOTAL * 0.02 - OFFSCREEN },
  { top: 78,  size: 28, opacity: 0.52, startX: TOTAL * 0.19 - OFFSCREEN },
  { top: 55,  size: 44, opacity: 0.72, startX: TOTAL * 0.38 - OFFSCREEN },
  { top: 88,  size: 34, opacity: 0.58, startX: TOTAL * 0.51 - OFFSCREEN },
  { top: 64,  size: 48, opacity: 0.76, startX: TOTAL * 0.67 - OFFSCREEN },
  { top: 74,  size: 30, opacity: 0.54, startX: TOTAL * 0.84 - OFFSCREEN },

  { top: 105, size: 42, opacity: 0.64, startX: TOTAL * 0.09 - OFFSCREEN },
  { top: 118, size: 24, opacity: 0.46, startX: TOTAL * 0.28 - OFFSCREEN },
  { top:  96, size: 46, opacity: 0.68, startX: TOTAL * 0.44 - OFFSCREEN },
  { top: 112, size: 32, opacity: 0.55, startX: TOTAL * 0.60 - OFFSCREEN },
  { top: 100, size: 38, opacity: 0.62, startX: TOTAL * 0.78 - OFFSCREEN },
  { top: 122, size: 26, opacity: 0.48, startX: TOTAL * 0.93 - OFFSCREEN },

  { top: 136, size: 36, opacity: 0.50, startX: TOTAL * 0.14 - OFFSCREEN },
  { top: 148, size: 22, opacity: 0.38, startX: TOTAL * 0.33 - OFFSCREEN },
  { top: 128, size: 40, opacity: 0.54, startX: TOTAL * 0.56 - OFFSCREEN },
  { top: 142, size: 28, opacity: 0.44, startX: TOTAL * 0.72 - OFFSCREEN },
  { top: 132, size: 20, opacity: 0.35, startX: TOTAL * 0.89 - OFFSCREEN },

  { top: 163, size: 24, opacity: 0.30, startX: TOTAL * 0.22 - OFFSCREEN },
  { top: 170, size: 30, opacity: 0.34, startX: TOTAL * 0.63 - OFFSCREEN },
]

export default function SceneBackground({ children }: Props) {
  const clock = useSharedValue(0)

  useEffect(() => {
    clock.value = withRepeat(
      withTiming(SPEED, { duration: SPEED, easing: Easing.linear }),
      -1,
      false
    )
  }, [])

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#3b9de0', '#6ab8e8', '#a0d4f5', '#cce8f8', '#e8f6ff']}
        locations={[0, 0.2, 0.45, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      {CLOUDS.map((c, i) => (
        <Cloud key={i} {...c} clock={clock} />
      ))}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})
