import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View, Dimensions } from 'react-native'
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Filter, FeDropShadow } from 'react-native-svg'

const { width } = Dimensions.get('window')
const DUNE_H = 18

const TAB_ICONS: Record<string, string> = {
  discover: '🔥',
  matches: '💬',
  groups: '👥',
  map: '🗺️',
  profile: '👤',
}
const TAB_LABELS: Record<string, string> = {
  discover: 'Entdecken',
  matches: 'Matches',
  groups: 'Gruppen',
  map: 'Karte',
  profile: 'Profil',
}

function DuneSvg() {
  const w = width
  return (
    <Svg width={w} height={DUNE_H} viewBox={`0 0 ${w} ${DUNE_H}`}>
      <Defs>
        {/* Back dune - darker shadow layer */}
        <SvgGradient id="duneBack" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#8b6914" stopOpacity="1" />
          <Stop offset="1" stopColor="#6b4c0a" stopOpacity="1" />
        </SvgGradient>
        {/* Mid dune */}
        <SvgGradient id="duneMid" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#c49a3c" stopOpacity="1" />
          <Stop offset="1" stopColor="#a07828" stopOpacity="1" />
        </SvgGradient>
        {/* Front dune - light highlight */}
        <SvgGradient id="duneFront" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#e8c97a" stopOpacity="1" />
          <Stop offset="0.5" stopColor="#d4a950" stopOpacity="1" />
          <Stop offset="1" stopColor="#c8a040" stopOpacity="1" />
        </SvgGradient>
        {/* Highlight crest */}
        <SvgGradient id="duneCrest" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f5dfa0" stopOpacity="0.9" />
          <Stop offset="1" stopColor="#e8c97a" stopOpacity="0" />
        </SvgGradient>
      </Defs>

      {/* Layer 1 – back dune (dark shadow, tallest, shifted right) */}
      <Path
        d={`M-20,${DUNE_H} C${w*0.05},${DUNE_H*0.6} ${w*0.2},${DUNE_H*0.1} ${w*0.52},${DUNE_H*0.45} C${w*0.75},${DUNE_H*0.7} ${w*0.88},${DUNE_H*0.15} ${w+20},${DUNE_H*0.3} L${w+20},${DUNE_H} Z`}
        fill="url(#duneBack)"
      />

      {/* Layer 2 – mid dune */}
      <Path
        d={`M-20,${DUNE_H} C${w*0.08},${DUNE_H*0.7} ${w*0.22},${DUNE_H*0.2} ${w*0.48},${DUNE_H*0.52} C${w*0.7},${DUNE_H*0.78} ${w*0.85},${DUNE_H*0.25} ${w+20},${DUNE_H*0.42} L${w+20},${DUNE_H} Z`}
        fill="url(#duneMid)"
      />

      {/* Layer 3 – front dune (brightest, lowest) */}
      <Path
        d={`M-20,${DUNE_H} C${w*0.12},${DUNE_H*0.82} ${w*0.28},${DUNE_H*0.35} ${w*0.5},${DUNE_H*0.62} C${w*0.68},${DUNE_H*0.82} ${w*0.82},${DUNE_H*0.42} ${w+20},${DUNE_H*0.58} L${w+20},${DUNE_H} Z`}
        fill="url(#duneFront)"
      />

      {/* Highlight crest on front dune ridge */}
      <Path
        d={`M${w*0.18},${DUNE_H*0.52} C${w*0.3},${DUNE_H*0.3} ${w*0.42},${DUNE_H*0.55} ${w*0.55},${DUNE_H*0.6}`}
        fill="none"
        stroke="#f5e0a0"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity={0.7}
      />
      <Path
        d={`M${w*0.6},${DUNE_H*0.68} C${w*0.7},${DUNE_H*0.5} ${w*0.8},${DUNE_H*0.58} ${w*0.88},${DUNE_H*0.54}`}
        fill="none"
        stroke="#f5e0a0"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={0.5}
      />
    </Svg>
  )
}

export default function SandDuneTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.duneContainer}>
        <DuneSvg />
      </View>

      <LinearGradient
        colors={['#d4a950', '#c49030', '#a87828']}
        style={styles.bar}
      >
        {/* Sand texture ripples */}
        <View style={styles.ripple1} />
        <View style={styles.ripple2} />

        {state.routes.filter(route => route.name !== 'premium').map((route, index) => {
          const focused = state.index === index
          const icon = TAB_ICONS[route.name] ?? '●'
          const label = TAB_LABELS[route.name] ?? route.name

          return (
            <Pressable
              key={route.key}
              style={styles.tab}
              onPress={() => navigation.navigate(route.name)}
              accessibilityRole="button"
              accessibilityLabel={label}
            >
              {focused ? (
                <View style={styles.activePill}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.1)']}
                    style={styles.activePillGrad}
                  >
                    <Text style={styles.activeIcon}>{icon}</Text>
                  </LinearGradient>
                </View>
              ) : (
                <Text style={styles.inactiveIcon}>{icon}</Text>
              )}
              <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
            </Pressable>
          )
        })}
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#5a3800',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 24,
  },
  duneContainer: {
    marginBottom: -1,
  },
  bar: {
    flexDirection: 'row',
    paddingBottom: 30,
    paddingTop: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  ripple1: {
    position: 'absolute',
    top: 14,
    left: '10%',
    width: '80%',
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
  },
  ripple2: {
    position: 'absolute',
    top: 22,
    left: '20%',
    width: '60%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 50,
  },
  activePill: {
    width: 46,
    height: 38,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#f5e0a0',
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  activePillGrad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIcon: { fontSize: 20 },
  inactiveIcon: { fontSize: 20, opacity: 0.45 },
  label: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  labelActive: { color: '#fff', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
})
