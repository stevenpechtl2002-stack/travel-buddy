import { colors, gradients, spacing } from '@/src/constants/theme'
import { useFollow } from '@/src/hooks/useFollow'
import { useAuth } from '@/src/hooks/useAuth'
import { supabase } from '@/src/lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, Dimensions, FlatList, Image, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native'

// ── Bottom Tab Bar ────────────────────────────────────────────
function ExploreTabBar() {
  const router = useRouter()
  const tabs = [
    { key: 'home',     icon: '⌂',  label: 'Home',      route: '/feed',            center: false },
    { key: 'chat',     icon: '💬', label: 'Chat',      route: '/chats',           center: false },
    { key: 'discover', icon: '✦',  label: 'Entdecken', route: '/(tabs)/discover', center: true  },
    { key: 'search',   icon: '⊙',  label: 'Suchen',    route: '/explore',         center: false },
  ] as const
  return (
    <View style={navStyles.wrapper}>
      <View style={navStyles.glow} />
      {tabs.map(tab => {
        const focused = tab.key === 'search'
        if (tab.center) return (
          <Pressable key={tab.key} style={navStyles.tab} onPress={() => router.push(tab.route as any)}>
            <View style={navStyles.discoverWrap}>
              <LinearGradient colors={gradients.brand} style={navStyles.discoverBtn}>
                <Text style={navStyles.discoverIcon}>{tab.icon}</Text>
              </LinearGradient>
            </View>
            <Text style={[navStyles.label, navStyles.discoverLabel]}>{tab.label}</Text>
          </Pressable>
        )
        return (
          <Pressable key={tab.key} style={navStyles.tab} onPress={() => router.push(tab.route as any)}>
            {focused
              ? <LinearGradient colors={gradients.brand} style={navStyles.pill}><Text style={navStyles.activeIcon}>{tab.icon}</Text></LinearGradient>
              : <Text style={navStyles.inactiveIcon}>{tab.icon}</Text>}
            <Text style={[navStyles.label, focused && navStyles.labelActive]}>{tab.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}
const navStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row',
    backgroundColor: '#111d2e', paddingTop: 10, paddingBottom: 30,
    borderTopWidth: 1, borderColor: 'rgba(232,132,92,0.18)',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 20,
  },
  glow: { position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, backgroundColor: 'rgba(232,132,92,0.2)' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  discoverWrap: { shadowColor: '#e8845c', shadowOpacity: 0.5, shadowRadius: 10, elevation: 8, marginTop: -16 },
  discoverBtn: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#111d2e' },
  discoverIcon: { fontSize: 22, color: '#fff', fontWeight: '900' },
  discoverLabel: { color: '#e8845c', fontWeight: '800', marginTop: 2 },
  pill: { width: 44, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  activeIcon: { fontSize: 20, color: '#fff', fontWeight: '700' },
  inactiveIcon: { fontSize: 20, color: 'rgba(245,240,235,0.28)' },
  label: { fontSize: 10, fontWeight: '600', color: 'rgba(245,240,235,0.35)' },
  labelActive: { color: '#e8845c', fontWeight: '800' },
})

const { width } = Dimensions.get('window')
const GRID_COL = 3
const CELL = (width - 4) / GRID_COL   // 2px gaps between 3 cells

// ── Types ─────────────────────────────────────────────────────
interface PersonResult {
  id: string
  name: string
  profile_image_url: string | null
  country: string | null
  bio: string | null
}

interface PlaceResult {
  location: string
  post_count: number
  cover_image: string | null
  latest_post_id: string
}

interface GridPost {
  id: string
  image_url: string | null
  location: string | null
  like_count: number
}

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ uri, size = 44, name = '?' }: { uri?: string | null; size?: number; name?: string }) {
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  return (
    <LinearGradient colors={gradients.brand}
      style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '900', fontSize: size * 0.38 }}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </LinearGradient>
  )
}

export default function ExploreScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const { follow, unfollow, isFollowing } = useFollow(userId)
  const router = useRouter()

  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'all' | 'people' | 'places'>('all')
  const [searching, setSearching] = useState(false)
  const [people, setPeople] = useState<PersonResult[]>([])
  const [places, setPlaces] = useState<PlaceResult[]>([])
  const [grid, setGrid] = useState<GridPost[]>([])
  const [gridLoading, setGridLoading] = useState(true)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load explore grid (posts with images, no query)
  useEffect(() => {
    supabase
      .from('posts')
      .select('id, image_url, location, like_count')
      .not('image_url', 'is', null)
      .order('like_count', { ascending: false })
      .limit(60)
      .then(({ data }) => { setGrid(data ?? []); setGridLoading(false) })
  }, [])

  // Search when query changes
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    if (!query.trim()) { setSearching(false); setPeople([]); setPlaces([]); return }
    debounce.current = setTimeout(() => runSearch(query.trim()), 350)
    return () => { if (debounce.current) clearTimeout(debounce.current) }
  }, [query])

  const runSearch = async (q: string) => {
    setSearching(true)

    // People: search by name, country, bio
    const { data: peopleData } = await supabase
      .from('profiles')
      .select('id, name, profile_image_url, country, bio')
      .or(`name.ilike.%${q}%,country.ilike.%${q}%,bio.ilike.%${q}%`)
      .neq('id', userId)
      .limit(20)
    setPeople(peopleData ?? [])

    // Places: search posts by location, group + count
    const { data: postsData } = await supabase
      .from('posts')
      .select('id, location, image_url')
      .ilike('location', `%${q}%`)
      .not('location', 'is', null)
      .order('created_at', { ascending: false })
      .limit(60)

    if (postsData) {
      const placeMap = new Map<string, PlaceResult>()
      for (const p of postsData) {
        if (!p.location) continue
        const key = p.location.toLowerCase()
        if (!placeMap.has(key)) {
          placeMap.set(key, { location: p.location, post_count: 0, cover_image: p.image_url, latest_post_id: p.id })
        }
        const entry = placeMap.get(key)!
        entry.post_count++
        if (!entry.cover_image && p.image_url) entry.cover_image = p.image_url
      }
      setPlaces([...placeMap.values()])
    }
  }

  // ── Person card (list)
  function PersonCard({ person }: { person: PersonResult }) {
    const followed = isFollowing(person.id)
    return (
      <View style={styles.personRow}>
        <Avatar uri={person.profile_image_url} name={person.name} size={52} />
        <View style={styles.personInfo}>
          <Text style={styles.personName}>{person.name}</Text>
          <Text style={styles.personSub} numberOfLines={1}>
            {[person.country, person.bio].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Pressable
          style={[styles.followBtn, followed && styles.followBtnDone]}
          onPress={() => followed ? unfollow(person.id) : follow(person.id)}
        >
          {followed ? (
            <Text style={styles.followBtnDoneText}>Gefolgt</Text>
          ) : (
            <LinearGradient colors={gradients.brand} style={styles.followBtnGrad}>
              <Text style={styles.followBtnText}>Folgen</Text>
            </LinearGradient>
          )}
        </Pressable>
      </View>
    )
  }

  // ── Place card (grid 2-col)
  function PlaceCard({ place }: { place: PlaceResult }) {
    return (
      <Pressable style={styles.placeCard}>
        {place.cover_image ? (
          <Image source={{ uri: place.cover_image }} style={styles.placeImage} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#1a3a5c', '#7e4a35']} style={styles.placeImage} />
        )}
        <View style={styles.placeOverlay} />
        <View style={styles.placeInfo}>
          <Text style={styles.placePin}>📍</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.placeName} numberOfLines={1}>{place.location}</Text>
            <Text style={styles.placeCount}>{place.post_count} {place.post_count === 1 ? 'Post' : 'Posts'}</Text>
          </View>
        </View>
      </Pressable>
    )
  }

  // ── Explore grid cell
  function GridCell({ post, index }: { post: GridPost; index: number }) {
    const isTall = index % 7 === 0   // every 7th item is tall (Instagram-style)
    return (
      <Pressable style={[styles.cell, isTall && styles.cellTall]}>
        {post.image_url ? (
          <Image source={{ uri: post.image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#1a2a3e', '#243a52']} style={StyleSheet.absoluteFill} />
        )}
        {post.location && (
          <View style={styles.cellPin}>
            <Text style={{ fontSize: 8 }}>📍</Text>
            <Text style={styles.cellPinText} numberOfLines={1}>{post.location}</Text>
          </View>
        )}
      </Pressable>
    )
  }

  const showSearch = query.trim().length > 0

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Suchen</Text>
      </View>


      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Orte, Personen suchen…"
            placeholderTextColor="rgba(245,240,235,0.3)"
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
        </View>
        {query.length > 0 && (
          <Pressable style={styles.cancelBtn} onPress={() => setQuery('')}>
            <Text style={styles.cancelText}>Abbrechen</Text>
          </Pressable>
        )}
      </View>

      {showSearch ? (
        <>
          {/* Filter tabs */}
          <View style={styles.tabs}>
            {([['all', 'Alle'], ['people', 'Personen'], ['places', 'Orte']] as const).map(([key, label]) => (
              <Pressable key={key} style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
                onPress={() => setTab(key)}>
                <Text style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.results} keyboardShouldPersistTaps="handled">
            {/* People */}
            {(tab === 'all' || tab === 'people') && people.length > 0 && (
              <View style={styles.section}>
                {tab === 'all' && <Text style={styles.sectionLabel}>Personen</Text>}
                {people.map(p => <PersonCard key={p.id} person={p} />)}
              </View>
            )}

            {/* Places */}
            {(tab === 'all' || tab === 'places') && places.length > 0 && (
              <View style={styles.section}>
                {tab === 'all' && <Text style={styles.sectionLabel}>Orte</Text>}
                <View style={styles.placesGrid}>
                  {places.map((pl, i) => <PlaceCard key={i} place={pl} />)}
                </View>
              </View>
            )}

            {/* No results */}
            {people.length === 0 && places.length === 0 && (
              <View style={styles.noResult}>
                <Text style={styles.noResultEmoji}>🔍</Text>
                <Text style={styles.noResultText}>Keine Ergebnisse für „{query}"</Text>
                <Text style={styles.noResultSub}>Versuche einen anderen Ort oder Namen</Text>
              </View>
            )}
          </ScrollView>
        </>
      ) : (
        // Explore grid
        gridLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            data={grid}
            keyExtractor={p => p.id}
            numColumns={GRID_COL}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={{ gap: 2 }}
            ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
            ListHeaderComponent={
              <View style={styles.exploreHint}>
                <Text style={styles.exploreHintText}>✦ Entdecke Orte & Reisende</Text>
              </View>
            }
            renderItem={({ item, index }) => <GridCell post={item} index={index} />}
          />
        )
      )}

      <ExploreTabBar />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingHorizontal: spacing.lg, paddingTop: 62, paddingBottom: 8,
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: colors.text },

  // Search
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingBottom: 10, gap: 10,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(245,240,235,0.09)',
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(245,240,235,0.11)',
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  cancelBtn: { paddingVertical: 4 },
  cancelText: { fontSize: 14, color: colors.primary, fontWeight: '700' },

  // Tabs
  tabs: {
    flexDirection: 'row', paddingHorizontal: spacing.md, gap: 8, paddingBottom: 12,
  },
  tabBtn: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(245,240,235,0.07)',
    borderWidth: 1, borderColor: 'rgba(245,240,235,0.1)',
  },
  tabBtnActive: { backgroundColor: 'rgba(232,132,92,0.18)', borderColor: 'rgba(232,132,92,0.4)' },
  tabLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  tabLabelActive: { color: colors.primary },

  // Results
  results: { paddingBottom: 100 },
  section: { marginBottom: 8 },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: colors.textMuted,
    letterSpacing: 1, textTransform: 'uppercase',
    paddingHorizontal: spacing.lg, paddingVertical: 10,
  },

  // Person row
  personRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: 'rgba(245,240,235,0.05)',
  },
  personInfo: { flex: 1, marginLeft: 12 },
  personName: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 2 },
  personSub: { fontSize: 12, color: colors.textMuted },
  followBtn: { borderRadius: 20, overflow: 'hidden', marginLeft: 8 },
  followBtnGrad: { paddingHorizontal: 14, paddingVertical: 7 },
  followBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  followBtnDone: {
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(245,240,235,0.2)',
    paddingHorizontal: 12, paddingVertical: 7, marginLeft: 8,
  },
  followBtnDoneText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },

  // Places 2-col grid
  placesGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.md, gap: 10,
  },
  placeCard: {
    width: (width - spacing.md * 2 - 10) / 2,
    height: 120, borderRadius: 16, overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  placeImage: { width: '100%', height: '100%', position: 'absolute' },
  placeOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  placeInfo: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 10, gap: 4,
  },
  placePin: { fontSize: 14, marginBottom: 1 },
  placeName: { fontSize: 13, fontWeight: '800', color: '#fff' },
  placeCount: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 1 },

  // No result
  noResult: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  noResultEmoji: { fontSize: 48, marginBottom: 16 },
  noResultText: { fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 },
  noResultSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },

  // Explore grid
  grid: { paddingBottom: 120 },
  exploreHint: {
    alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderColor: 'rgba(245,240,235,0.06)',
    marginBottom: 2,
  },
  exploreHintText: { fontSize: 12, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.5 },
  cell: {
    width: CELL, height: CELL,
    backgroundColor: colors.surface, overflow: 'hidden',
    position: 'relative',
  },
  cellTall: { height: CELL * 2 + 2 },
  cellPin: {
    position: 'absolute', bottom: 4, left: 4, right: 4,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 6,
    paddingHorizontal: 4, paddingVertical: 2,
  },
  cellPinText: { fontSize: 8, color: '#fff', fontWeight: '700', flex: 1 },
})
