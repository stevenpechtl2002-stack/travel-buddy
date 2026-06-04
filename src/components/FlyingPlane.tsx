import Svg, { Path, Ellipse, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg'
import { View, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

const TRAIL_WIDTH = 160

export default function FlyingPlane() {
  return (
    <View style={styles.wrapper}>
      {/* Contrail */}
      <View style={styles.trails}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,1)']}
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={styles.trail1}
        />
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.8)']}
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={styles.trail2}
        />
      </View>

      {/* Plane SVG */}
      <Svg width={64} height={50} viewBox="0 0 64 50">
        <Defs>
          <SvgGradient id="body" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#c8d8ff" />
            <Stop offset="1" stopColor="#ffffff" />
          </SvgGradient>
          <SvgGradient id="wing" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#ffffff" />
            <Stop offset="1" stopColor="#a0b8ff" />
          </SvgGradient>
        </Defs>

        {/* Fuselage */}
        <Path
          d="M4,25 Q10,21 26,23 Q46,22 58,24 Q61,24.5 58,26 Q46,28 26,27 Q10,29 4,25Z"
          fill="url(#body)"
          stroke="#8899cc"
          strokeWidth="0.5"
        />
        {/* Nose */}
        <Path d="M56,23.5 Q64,24.5 58,26 Q56,26 56,23.5Z" fill="#e0e8ff" />

        {/* Main wing top */}
        <Path d="M24,24 L14,9 L20,9 L30,22Z" fill="url(#wing)" stroke="#8899cc" strokeWidth="0.5" />
        {/* Main wing bottom */}
        <Path d="M24,26 L14,41 L20,41 L30,28Z" fill="#c0cff0" stroke="#8899cc" strokeWidth="0.5" />

        {/* Engines */}
        <Ellipse cx="25" cy="20" rx="5" ry="2.2" fill="#a0b0e0" />
        <Ellipse cx="25" cy="30" rx="5" ry="2.2" fill="#a0b0e0" />

        {/* Tail vertical */}
        <Path d="M8,24.5 L9,17 L14,18.5 L14,24.5Z" fill="white" stroke="#8899cc" strokeWidth="0.5" />
        {/* Tail horizontal */}
        <Path d="M9,24.5 L5,18 L11,19 L12,24.5Z" fill="white" />
        <Path d="M9,25.5 L5,32 L11,31 L12,25.5Z" fill="#c0cff0" />

        {/* Windows */}
        <Path d="M30,23.5 Q40,23 48,23.5 Q48,24.2 40,24.5 Q30,24.2 30,23.5Z"
          fill="rgba(100,180,255,0.6)" />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center' },
  trails: { width: TRAIL_WIDTH, justifyContent: 'center', gap: 7 },
  trail1: { width: TRAIL_WIDTH, height: 3, borderRadius: 2 },
  trail2: { width: TRAIL_WIDTH, height: 2, borderRadius: 2 },
})
