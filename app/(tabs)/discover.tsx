import MatchPopup from '@/src/components/MatchPopup'
import SwipeCard, { SwipeCardRef } from '@/src/components/SwipeCard'
import FlyingPlane from '@/src/components/FlyingPlane'
import FilterModal, { Filters, DEFAULT_FILTERS } from '@/src/components/FilterModal'
import UserSearchModal from '@/src/components/UserSearchModal'
import SceneBackground from '@/src/components/SceneBackground'
import PremiumModal from '@/src/components/PremiumModal'
import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { addDemoMatch } from '@/src/lib/demoMatchStore'
import { useDiscover } from '@/src/hooks/useDiscover'
import { useSwipe } from '@/src/hooks/useSwipe'
import { getLikesRemaining, recordLike, DAILY_LIMIT } from '@/src/hooks/useLikeLimit'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import ReAnimated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing as ReEasing } from 'react-native-reanimated'

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
  const [searchVisible, setSearchVisible] = useState(false)
  const [premiumVisible, setPremiumVisible] = useState(false)
  const [likesLeft, setLikesLeft] = useState(DAILY_LIMIT)
  const isPremium = (session?.user as any)?.user_metadata?.is_premium ?? false
  const router = useRouter()
  const cardRef = useRef<SwipeCardRef>(null)

  useEffect(() => {
    getLikesRemaining().then(setLikesLeft)
  }, [])
  const planeX = useSharedValue(-200)

  const planeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: planeX.value }],
  }))

  useEffect(() => {
    planeX.value = withRepeat(
      withSequence(
        withTiming(SCREEN_WIDTH + 200, { duration: 8000, easing: ReEasing.linear }),
        withTiming(-200, { duration: 0 })
      ),
      -1,
      false
    )
  }, [])


  const filteredCandidates = candidates.filter(c => {
    const p = c.profile
    if (p.age < filters.ageMin || p.age > filters.ageMax) return false
    if (filters.gender !== 'all') {
      const g = (p as any).gender as string | undefined
      if (g && g !== filters.gender) return false
    }
    if (filters.religion !== 'all') {
      const r = p.religion ?? 'Keine'
      if (r !== filters.religion) return false
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
    filters.religion !== 'all',
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
    const isDemo = top.profile.id.startsWith('demo-')
    const remainingAfterRemove = filteredCandidates.length - 1

    if (direction === 'right' && !isPremium) {
      const remaining = await getLikesRemaining()
      if (remaining <= 0) {
        setPremiumVisible(true)
        setProcessing(false)
        return
      }
      const newRemaining = await recordLike()
      setLikesLeft(newRemaining)
    }

    if (isDemo) {
      if (direction === 'right' && Math.random() < 0.5) {
        setMatchInfo({ name: top.profile.name })
        addDemoMatch({
          id: `demo-match-${top.profile.id}`,
          user_a_id: userId,
          user_b_id: top.profile.id,
          created_at: new Date().toISOString(),
          other_user: top.profile,
        })
      }
    } else {
      const { isMatch } = await recordSwipe(top.profile.id, direction)
      if (isMatch) setMatchInfo({ name: top.profile.name })
    }

    removeTop()
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
    <View style={{ flex: 1 }}>
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
            <View style={{ gap: 10, width: '80%' }}>
              <Pressable style={styles.reloadButton} onPress={() => setFilterVisible(true)}>
                <LinearGradient colors={gradients.brandH} style={styles.reloadGrad}>
                  <Text style={styles.reloadText}>⚙ Filter anpassen</Text>
                </LinearGradient>
              </Pressable>
              <Pressable style={styles.resetButton} onPress={() => setFilters(DEFAULT_FILTERS)}>
                <Text style={styles.resetButtonText}>✕ Filter zurücksetzen</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.reloadButton} onPress={reload}>
              <LinearGradient colors={gradients.brandH} style={styles.reloadGrad}>
                <Text style={styles.reloadText}>Aktualisieren</Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </SceneBackground>
      <ReAnimated.View style={[styles.plane, planeAnimStyle]} pointerEvents="none">
        <FlyingPlane />
      </ReAnimated.View>
      <FilterModal
        visible={filterVisible}
        filters={filters}
        onChange={setFilters}
        onClose={() => setFilterVisible(false)}
      />
    </View>
  )

  const top = filteredCandidates[0]

  return (
    <View style={{flex:1}}>
    <SceneBackground>
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        {/* Logo links → öffnet Feed */}
        <Pressable onPress={() => router.push('/feed')}>
          <LinearGradient colors={gradients.brand} style={styles.logoGrad}>
            <Text style={styles.logoInner}>✈</Text>
          </LinearGradient>
        </Pressable>

        {/* Such-Button Mitte */}
        <Pressable style={styles.searchBtn} onPress={() => setSearchVisible(true)}>
          <Text style={styles.searchBtnIcon}>🔍</Text>
          <Text style={styles.searchBtnText}>Suchen</Text>
        </Pressable>

        {/* Filter + Likes + Profil rechts */}
        <View style={styles.headerRight}>
          {!isPremium && (
            <Pressable style={[styles.likesCounter, likesLeft <= 5 && styles.likesCounterLow]} onPress={() => setPremiumVisible(true)}>
              <Text style={styles.likesCounterText}>♥ {likesLeft}</Text>
            </Pressable>
          )}
          <Pressable style={styles.filterBtn} onPress={() => setFilterVisible(true)}>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
            <Text style={styles.filterIcon}>⚙</Text>
          </Pressable>
          <Pressable style={styles.profileBtn} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.profileBtnIcon}>◯</Text>
          </Pressable>
        </View>
      </View>

      {/* Card + Buttons together */}
      <View style={styles.cardWrapper}>
        <SwipeCard
          key={top.profile.id}
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
            <LinearGradient colors={gradients.brand} style={styles.likeBtnGradient}>
              <Text style={styles.likeBtnText}>♥</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>

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

      <UserSearchModal
        visible={searchVisible}
        currentUserId={userId}
        onClose={() => setSearchVisible(false)}
      />

      <PremiumModal
        visible={premiumVisible}
        userId={userId}
        onClose={() => setPremiumVisible(false)}
        onUpgraded={() => setLikesLeft(999)}
      />
    </View>
    </SceneBackground>

    {/* Animated airplane */}
    <ReAnimated.View style={[styles.plane, planeAnimStyle]} pointerEvents="none">
      <FlyingPlane />
    </ReAnimated.View>


    </View>
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
  reloadGrad: { paddingHorizontal: 28, paddingVertical: 13, alignItems: 'center' },
  reloadText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  resetButton: { borderRadius: 50, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', paddingVertical: 13, alignItems: 'center' },
  resetButtonText: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 15 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: 10 },
  logoGrad: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  logoInner: { fontSize: 17, color: '#fff' },
  // Search button — center of header
  searchBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(245,240,235,0.12)', borderRadius: 22,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, borderColor: 'rgba(245,240,235,0.2)',
    marginHorizontal: 6,
  },
  searchBtnIcon: { fontSize: 14 },
  searchBtnText: { fontSize: 14, fontWeight: '700', color: colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likesCounter: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14,
    paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  likesCounterLow: { backgroundColor: 'rgba(255,71,87,0.2)', borderColor: 'rgba(255,71,87,0.5)' },
  likesCounterText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  filterBtn: { width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(245,240,235,0.1)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(245,240,235,0.18)' },
  filterIcon: { fontSize: 16, color: colors.text },
  filterBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: colors.primary,
    borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
    zIndex: 1, paddingHorizontal: 3 },
  filterBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  profileBtn: { width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(245,240,235,0.1)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(245,240,235,0.18)' },
  profileBtnIcon: { fontSize: 18, color: colors.text },
  cardWrapper: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'flex-start', paddingTop: 4, zIndex: 10 },
  buttons: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingTop: 16, gap: 40, zIndex: 10 },
  plane: { position: 'absolute', top: 95, zIndex: 999, elevation: 999 },
  nopeBtn: { width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(245,240,235,0.1)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(245,240,235,0.22)',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  nopeBtnText: { fontSize: 24, color: '#e05555' },
  likeBtn: { width: 68, height: 68, borderRadius: 34, overflow: 'hidden',
    shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
  likeBtnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  likeBtnText: { fontSize: 26, color: '#fff' },
  btnDisabled: { opacity: 0.4 },
})
