import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { LinearGradient } from 'expo-linear-gradient'
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg'
import { colors } from '../constants/theme'

const { width } = Dimensions.get('window')
const DUNE_H = 16

const TAB_ICONS: Record<string, string> = {
  discover: '✦',
  matches: '♡',
  groups: '◈',
  map: '◎',
  profile: '○',
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
        <SvgGradient id="d1" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1a2a3e" stopOpacity="1" />
          <Stop offset="1" stopColor="#111d2e" stopOpacity="1" />
        </SvgGradient>
        <SvgGradient id="d2" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1e3248" stopOpacity="1" />
          <Stop offset="1" stopColor="#142030" stopOpacity="1" />
        </SvgGradient>
        <SvgGradient id="d3" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#243a52" stopOpacity="1" />
          <Stop offset="1" stopColor="#1a2a3e" stopOpacity="1" />
        </SvgGradient>
      </Defs>
      <Path
        d={`M-20,${DUNE_H} C${w*0.05},${DUNE_H*0.5} ${w*0.22},${DUNE_H*0.05} ${w*0.5},${DUNE_H*0.4} C${w*0.72},${DUNE_H*0.65} ${w*0.87},${DUNE_H*0.12} ${w+20},${DUNE_H*0.28} L${w+20},${DUNE_H} Z`}
        fill="url(#d1)"
      />
      <Path
        d={`M-20,${DUNE_H} C${w*0.08},${DUNE_H*0.62} ${w*0.25},${DUNE_H*0.18} ${w*0.46},${DUNE_H*0.48} C${w*0.68},${DUNE_H*0.74} ${w*0.83},${DUNE_H*0.22} ${w+20},${DUNE_H*0.40} L${w+20},${DUNE_H} Z`}
        fill="url(#d2)"
      />
      <Path
        d={`M-20,${DUNE_H} C${w*0.12},${DUNE_H*0.78} ${w*0.3},${DUNE_H*0.35} ${w*0.48},${DUNE_H*0.58} C${w*0.66},${DUNE_H*0.78} ${w*0.8},${DUNE_H*0.40} ${w+20},${DUNE_H*0.56} L${w+20},${DUNE_H} Z`}
        fill="url(#d3)"
      />
      {/* Warm highlight ridge — subtle coral accent */}
      <Path
        d={`M${w*0.2},${DUNE_H*0.52} C${w*0.32},${DUNE_H*0.3} ${w*0.44},${DUNE_H*0.52} ${w*0.58},${DUNE_H*0.58}`}
        fill="none" stroke="rgba(232,132,92,0.25)" strokeWidth="1.5" strokeLinecap="round"
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
      <LinearGradient colors={['#1a2a3e', '#111d2e']} style={styles.bar}>
        {/* Top separator glow */}
        <View style={styles.glow} />
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
                  <LinearGradient colors={['#e8845c', '#c9566e']} style={styles.activePillGrad}>
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
    position: 'absolute', bottom: 0, left: 0, right: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 24,
  },
  duneContainer: { marginBottom: -1 },
  bar: {
    flexDirection: 'row', paddingBottom: 28, paddingTop: 6,
    position: 'relative', overflow: 'hidden',
  },
  glow: {
    position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
    backgroundColor: 'rgba(232,132,92,0.18)', borderRadius: 1,
  },
  tab: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 48,
  },
  activePill: {
    width: 44, height: 36, borderRadius: 18, overflow: 'hidden',
    shadowColor: colors.primary, shadowOpacity: 0.45, shadowRadius: 8,
  },
  activePillGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  activeIcon: { fontSize: 18, color: '#fff', fontWeight: '700' },
  inactiveIcon: { fontSize: 18, color: 'rgba(245,240,235,0.28)', fontWeight: '400' },
  label: { fontSize: 10, fontWeight: '600', color: 'rgba(245,240,235,0.35)', letterSpacing: 0.2 },
  labelActive: { color: colors.primary, fontWeight: '800' },
})
