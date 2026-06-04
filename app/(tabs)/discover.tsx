import MatchPopup from '@/src/components/MatchPopup'
import SwipeCard, { SwipeCardRef } from '@/src/components/SwipeCard'
import WalkingCamel from '@/src/components/WalkingCamel'
import FlyingPlane from '@/src/components/FlyingPlane'
import FilterModal, { Filters, DEFAULT_FILTERS } from '@/src/components/FilterModal'
import SceneBackground from '@/src/components/SceneBackground'
import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { useDiscover } from '@/src/hooks/useDiscover'
import { useSwipe } from '@/src/hooks/useSwipe'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Animated, ActivityIndicator, Alert, Dimensions, Easing, Pressable, StyleSheet, Text, View } from 'react-native'

const SCREEN_WIDTH = Dimensions.get('window').width

export default function DiscoverScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const { candidates, loading, error, reload, removeTop } = useDiscover(userId)
  const { recordSwipe } = useSwipe(userId)
  const [matchInfo, setMatchInfo] = useState<{ name: string } | null>(null)
  const [processing, setProcessing] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [filterVisible, setFilterVisible] = useState(false)
  const router = useRouter()
  const cardRef = useRef<SwipeCardRef>(null)
  const camelX = useRef(new Animated.Value(-150)).current
  const planeX = useRef(new Animated.Value(-60)).current

  useEffect(() => {
    const fly = Animated.loop(
      Animated.sequence([
        Animated.timing(planeX, {
          toValue: SCREEN_WIDTH + 60,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(planeX, {
          toValue: -60,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    )
    fly.start()
    return () => fly.stop()
  }, [])

  useEffect(() => {
    camelX.setValue(-150)
    const walk = Animated.loop(
      Animated.sequence([
        Animated.timing(camelX, {
          toValue: SCREEN_WIDTH + 150,
          duration: 14000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(camelX, {
          toValue: -150,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    )
    walk.start()
    return () => { walk.stop(); camelX.setValue(-150) }
  }, [])

  const filteredCandidates = candidates.filter(c => {
    const p = c.profile
    if (p.age < filters.ageMin || p.age > filters.ageMax) return false
    if (filters.gender !== 'all') {
      const g = (p as any).gender as string | undefined
      if (g && g !== filters.gender) return false
    }
    if (filters.destination) {
      const dest = filters.destination.toLowerCase()
      const hasMatch = c.destinations.some(d =>
        (d.city ?? '').toLowerCase().includes(dest) ||
        (d.country ?? '').toLowerCase().includes(dest)
      )
      if (!hasMatch) return false
    }
    if (filters.origin) {
      const origin = filters.origin.toLowerCase()
      if (!((p.country ?? '').toLowerCase().includes(origin))) return false
    }
    return true
  })

  const activeFilterCount = [
    filters.gender !== 'all',
    filters.destination !== '',
    filters.origin !== '',
    filters.ageMin !== 18 || filters.ageMax !== 60,
  ].filter(Boolean).length

  const handleButtonPress = (direction: 'left' | 'right') => {
    if (processing) return
    cardRef.current?.triggerSwipe(direction)
  }

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (processing) return
    const top = filteredCandidates[0]
    if (!top) return
    setProcessing(true)
    const { isMatch, error: swipeError } = await recordSwipe(top.profile.id, direction)
    if (swipeError) {
      Alert.alert('Fehler', 'Swipe konnte nicht gespeichert werden.')
      setProcessing(false)
      return
    }
    const remainingAfterRemove = filteredCandidates.length - 1
    removeTop()
    if (isMatch) setMatchInfo({ name: top.profile.name })
    if (remainingAfterRemove <= 3) reload()
    setProcessing(false)
  }

  if (loading) return (
    <SceneBackground>
      <View style={styles.loadingContainer}>
        <LinearGradient colors={gradients.brand} style={styles.loadingIcon}>
          <Text style={{ fontSize: 28 }}>✈</Text>
        </LinearGradient>
        <Text style={styles.loadingText}>Reisende in deiner Nähe…</Text>
      </View>
    </SceneBackground>
  )

  if (error) return (
    <SceneBackground>
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>❌</Text>
        <Text style={styles.emptyText}>Fehler beim Laden</Text>
        <Pressable style={styles.reloadButton} onPress={reload}>
          <LinearGradient colors={gradients.brandH} style={styles.reloadGrad}>
            <Text style={styles.reloadText}>Erneut versuchen</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SceneBackground>
  )

  if (filteredCandidates.length === 0) return (
    <SceneBackground>
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>🌍</Text>
        <Text style={styles.emptyText}>
          {candidates.length > 0 ? 'Keine Reisenden mit diesen Filtern' : 'Keine neuen Reisenden gerade'}
        </Text>
        <Text style={styles.emptySub}>
          {candidates.length > 0 ? 'Ändere deine Filtereinstellungen' : 'Schau später nochmal vorbei'}
        </Text>
        {candidates.length > 0 ? (
          <Pressable style={styles.reloadButton} onPress={() => setFilterVisible(true)}>
            <LinearGradient colors={gradients.brandH} style={styles.reloadGrad}>
              <Text style={styles.reloadText}>Filter anpassen</Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <Pressable style={styles.reloadButton} onPress={reload}>
            <LinearGradient colors={gradients.brandH} style={styles.reloadGrad}>
              <Text style={styles.reloadText}>Aktualisieren</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </SceneBackground>
  )

  const top = filteredCandidates[0]

  return (
    <SceneBackground>
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <LinearGradient colors={gradients.brand} style={styles.logoGrad}>
            <Text style={styles.logoInner}>✈</Text>
          </LinearGradient>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.logo}>Travel Buddy</Text>
          <Text style={styles.subtitle}>{filteredCandidates.length} Reisende online</Text>
        </View>
        <Pressable style={styles.filterBtn} onPress={() => setFilterVisible(true)}>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
          <Text style={styles.filterIcon}>⚙</Text>
        </Pressable>
        <View style={styles.onlinePill}>
          <View style={styles.greenDot} />
          <Text style={styles.onlineText}>Live</Text>
        </View>
      </View>

      {/* Card + Buttons together */}
      <View style={styles.cardWrapper}>
        <SwipeCard
          ref={cardRef}
          profile={top.profile}
          destinations={top.destinations}
          interests={top.interests}
          onSwipeLeft={() => handleSwipe('left')}
          onSwipeRight={() => handleSwipe('right')}
        />
        <View style={styles.buttons}>
          <Pressable style={[styles.nopeBtn, processing && styles.btnDisabled]}
            onPress={() => handleButtonPress('left')} disabled={processing}>
            <Text style={styles.nopeBtnText}>✕</Text>
          </Pressable>

          <Pressable style={[styles.likeBtn, processing && styles.btnDisabled]}
            onPress={() => handleButtonPress('right')} disabled={processing}>
            <View style={styles.likeBtnGradient}>
              <Text style={styles.likeBtnText}>♥</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Airplane flying at top */}
      <Animated.View style={[styles.plane, { transform: [{ translateX: planeX }] }]} pointerEvents="none">
        <FlyingPlane />
      </Animated.View>

      {/* Animated camel — walks above the dunes */}
      <Animated.View style={[styles.camel, { transform: [{ translateX: camelX }] }]} pointerEvents="none">
        <WalkingCamel size={110} />
      </Animated.View>

      <MatchPopup
        visible={!!matchInfo}
        matchName={matchInfo?.name ?? ''}
        onStartChat={() => { setMatchInfo(null); router.push('/(tabs)/matches') }}
        onClose={() => setMatchInfo(null)}
      />

      <FilterModal
        visible={filterVisible}
        filters={filters}
        onChange={setFilters}
        onClose={() => setFilterVisible(false)}
      />
    </View>
    </SceneBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  loadingContainer: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textMuted, fontSize: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyEmoji: { fontSize: 60, marginBottom: spacing.md },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg },
  reloadButton: { borderRadius: 50, overflow: 'hidden' },
  reloadGrad: { paddingHorizontal: 28, paddingVertical: 13 },
  reloadText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: 10 },
  logoGrad: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  logoInner: { fontSize: 18, color: '#fff' },
  headerCenter: { flex: 1 },
  logo: { fontSize: 18, fontWeight: '900', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  filterBtn: { width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  filterIcon: { fontSize: 17, color: '#fff' },
  filterBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: colors.primary,
    borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
    zIndex: 1, paddingHorizontal: 3 },
  filterBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 50,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  onlineText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  cardWrapper: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'flex-start', paddingTop: 4, zIndex: 10 },
  buttons: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingTop: 16, gap: 40, zIndex: 10 },
  camel: { position: 'absolute', bottom: 92, zIndex: 1 },
  plane: { position: 'absolute', top: 68, zIndex: 2 },
  nopeBtn: { width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  nopeBtnText: { fontSize: 24, color: '#ff4757' },
  likeBtn: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden',
    backgroundColor: 'rgba(220,60,0,0.78)',
    borderWidth: 1.5, borderColor: 'rgba(255,120,20,0.9)',
    shadowColor: '#ff8c00', shadowOpacity: 0.25, shadowRadius: 14, elevation: 8 },
  likeBtnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  likeBtnText: { fontSize: 26, color: '#fff' },
  btnDisabled: { opacity: 0.4 },
})
