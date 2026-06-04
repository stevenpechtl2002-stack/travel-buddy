import Svg, { Path, Ellipse, G } from 'react-native-svg'
import { View, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

const TRAIL_WIDTH = 180

export default function FlyingPlane() {
  return (
    <View style={styles.wrapper}>
      {/* Contrail lines */}
      <View style={styles.trails}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.9)']}
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={styles.trail1}
        />
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.7)']}
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={styles.trail2}
        />
      </View>

      {/* Plane SVG — viewed from slightly below, flying right */}
      <Svg width={48} height={38} viewBox="0 0 48 38">
        {/* Fuselage — tapered tube */}
        <Path
          d="M2,19 Q6,16 20,17.5 Q36,17 44,18 Q46,18.5 44,19.5 Q36,21 20,20.5 Q6,22 2,19Z"
          fill="white"
        />
        {/* Nose cone */}
        <Path d="M42,18 Q48,18.5 44,19.5 Q42,19.5 42,18Z" fill="#e8e8ff"/>

        {/* Main wings — swept back */}
        <Path
          d="M18,18.5 L10,7 L16,7 L24,17 Z"
          fill="white"
        />
        <Path
          d="M18,19.5 L10,31 L16,31 L24,21 Z"
          fill="rgba(220,220,255,0.9)"
        />
        {/* Wing tips */}
        <Path d="M10,7 L8,9 L16,7Z" fill="rgba(200,200,255,0.7)"/>
        <Path d="M10,31 L8,29 L16,31Z" fill="rgba(200,200,255,0.7)"/>

        {/* Engine pods under wings */}
        <Ellipse cx="19" cy="15" rx="4" ry="1.8" fill="rgba(180,180,220,0.85)"/>
        <Ellipse cx="19" cy="23" rx="4" ry="1.8" fill="rgba(180,180,220,0.85)"/>

        {/* Tail fin — vertical */}
        <Path d="M5,18.5 L6,13 L10,14 L10,18.5Z" fill="white"/>
        {/* Tail fins — horizontal */}
        <Path d="M7,18.5 L4,14 L8,14.5 L9,18.5Z" fill="white"/>
        <Path d="M7,19.5 L4,24 L8,23.5 L9,19.5Z" fill="rgba(220,220,255,0.85)"/>

        {/* Window row */}
        <Path d="M22,18 Q28,17.8 34,18 Q34,18.5 28,18.7 Q22,18.5 22,18Z"
          fill="rgba(150,200,255,0.4)" />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trails: {
    width: TRAIL_WIDTH,
    justifyContent: 'center',
    gap: 6,
  },
  trail1: {
    width: TRAIL_WIDTH,
    height: 2.5,
    borderRadius: 2,
  },
  trail2: {
    width: TRAIL_WIDTH,
    height: 1.5,
    borderRadius: 2,
  },
})
