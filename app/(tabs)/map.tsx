import Globe3D from '@/src/components/Globe3D'
import { gradients, spacing } from '@/src/constants/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import {
  Animated, Dimensions, Image, Pressable, ScrollView,
  StyleSheet, Text, View,
} from 'react-native'

const { width } = Dimensions.get('window')

const STORIES = [
  { id: '1', user: 'Lisa M.', avatar: '👩', location: 'Bali, Indonesien', flag: '🇮🇩', time: 'vor 2 Min', emoji: '🌊', text: 'Sonnenuntergang am Tanah Lot 🙏', color: '#e8845c' },
  { id: '2', user: 'Marco R.', avatar: '👨', location: 'Bangkok, Thailand', flag: '🇹🇭', time: 'vor 8 Min', emoji: '🍜', text: 'Bestes Pad Thai meines Lebens! 🔥', color: '#4a9eca' },
  { id: '3', user: 'Sophie K.', avatar: '👩‍🦰', location: 'Tokio, Japan', flag: '🇯🇵', time: 'vor 15 Min', emoji: '🌸', text: 'Kirschblüten im Shinjuku Park 💕', color: '#c9566e' },
  { id: '4', user: 'Tom B.', avatar: '🧑', location: 'Barcelona, Spanien', flag: '🇪🇸', time: 'vor 22 Min', emoji: '⛱', text: 'Barceloneta Beach — perfektes Wetter!', color: '#4ade80' },
  { id: '5', user: 'Mia L.', avatar: '👱‍♀️', location: 'Santorini, Griechenland', flag: '🇬🇷', time: 'vor 34 Min', emoji: '🏛️', text: 'Die blauen Kuppeln sind unreal 😍', color: '#c9566e' },
  { id: '6', user: 'Leon W.', avatar: '👨‍🦱', location: 'Kapstadt, Südafrika', flag: '🇿🇦', time: 'vor 1 Std', emoji: '🦁', text: 'Safari war das Erlebnis meines Lebens!', color: '#f0c070' },
]

const COUNTRIES = [
  { flag: '🇮🇩', name: 'Indonesien', stories: 48, travelers: 312 },
  { flag: '🇯🇵', name: 'Japan', stories: 91, travelers: 528 },
  { flag: '🇹🇭', name: 'Thailand', stories: 76, travelers: 445 },
  { flag: '🇪🇸', name: 'Spanien', stories: 53, travelers: 289 },
  { flag: '🇬🇷', name: 'Griechenland', stories: 41, travelers: 198 },
  { flag: '🇲🇦', name: 'Marokko', stories: 29, travelers: 134 },
  { flag: '🇿🇦', name: 'Südafrika', stories: 22, travelers: 98 },
  { flag: '🇺🇸', name: 'USA', stories: 105, travelers: 621 },
  { flag: '🇦🇺', name: 'Australien', stories: 38, travelers: 176 },
  { flag: '🇵🇹', name: 'Portugal', stories: 34, travelers: 201 },
]

function StoryBubble({ story, delay }: { story: typeof STORIES[0]; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay, useNativeDriver: true, tension: 80, friction: 8 }).start()
  }, [])

  return (
    <Animated.View style={[styles.storyCard, {
      opacity: anim,
      transform: [{ scale: anim.interpolate({ inputRange: [0,1], outputRange: [0.8, 1] }) }],
    }]}>
      <View style={[styles.storyAvatarRing, { borderColor: story.color }]}>
        <Text style={styles.storyAvatar}>{story.avatar}</Text>
      </View>
      <View style={styles.storyInfo}>
        <View style={styles.storyTopRow}>
          <Text style={styles.storyUser}>{story.user}</Text>
          <Text style={styles.storyTime}>{story.time}</Text>
        </View>
        <Text style={styles.storyLoc}>{story.flag} {story.location}</Text>
        <Text style={styles.storyText}>{story.emoji} {story.text}</Text>
      </View>
    </Animated.View>
  )
}

function GlobePage() {
  const rotAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const headerAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start()
    Animated.loop(
      Animated.timing(rotAnim, { toValue: 360, duration: 18000, useNativeDriver: true })
    ).start()
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#0d47a1', '#1565c0', '#1976d2', '#42a5f5', '#90caf9']}
        style={StyleSheet.absoluteFill} />

      <Animated.View style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0,1], outputRange: [-20, 0] }) }] }}>
        <View style={styles.globeHeader}>
          <Text style={styles.globeTitle}>Weltkarte 🌍</Text>
          <Animated.View style={[styles.livePill, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </Animated.View>
        </View>
        <Text style={styles.globeSub}>Stories & Reisende in Echtzeit</Text>
      </Animated.View>

      {/* 3D Globe */}
      <Animated.View style={[styles.globeWrap, {
        opacity: headerAnim,
        transform: [{ scale: pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [1, 1.02] }) }],
      }]}>
        <Globe3D rotation={rotAnim} />

        {/* Story pins on globe */}
        <View style={[styles.pin, { top: '22%', left: '52%' }]}>
          <View style={[styles.pinDot, { backgroundColor: '#e8845c' }]} />
          <Text style={styles.pinLabel}>Bali 🌊</Text>
        </View>
        <View style={[styles.pin, { top: '18%', left: '72%' }]}>
          <View style={[styles.pinDot, { backgroundColor: '#c9566e' }]} />
          <Text style={styles.pinLabel}>Tokio 🌸</Text>
        </View>
        <View style={[styles.pin, { top: '28%', left: '38%' }]}>
          <View style={[styles.pinDot, { backgroundColor: '#4ade80' }]} />
          <Text style={styles.pinLabel}>Barcelona ⛱</Text>
        </View>
        <View style={[styles.pin, { top: '55%', left: '30%' }]}>
          <View style={[styles.pinDot, { backgroundColor: '#ffcc00' }]} />
          <Text style={styles.pinLabel}>Kapstadt 🦁</Text>
        </View>
      </Animated.View>

      {/* Near you */}
      <View style={styles.nearSection}>
        <Text style={styles.sectionTitle}>📍 In deiner Nähe</Text>
        <Text style={styles.sectionSub}>GPS aktivieren für lokale Stories</Text>
        <Pressable>
          <LinearGradient colors={gradients.brand} style={styles.gpsBtn}>
            <Text style={styles.gpsBtnText}>📍 Standort aktivieren</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Recent stories */}
      <Text style={styles.sectionTitle2}>🔥 Aktuelle Stories</Text>
      {STORIES.slice(0, 3).map((s, i) => (
        <StoryBubble key={s.id} story={s} delay={i * 100} />
      ))}
      <View style={{ height: 120 }} />
    </ScrollView>
  )
}

function StoriesPage() {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
  }, [])

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#0d47a1', '#1565c0', '#1976d2', '#42a5f5', '#90caf9']}
        style={StyleSheet.absoluteFill} />

      <View style={styles.storiesHeader}>
        <Text style={styles.globeTitle}>Stories & Tipps 📖</Text>
        <Text style={styles.globeSub}>Land für Land — von echten Reisenden</Text>
      </View>

      {/* All stories */}
      <Text style={styles.sectionTitle2}>🎬 Alle Stories</Text>
      {STORIES.map((s, i) => (
        <StoryBubble key={s.id} story={s} delay={i * 80} />
      ))}

      {/* Countries */}
      <Text style={styles.sectionTitle2}>🌍 Nach Land</Text>
      {COUNTRIES.map((c, i) => (
        <Animated.View key={c.name} style={[styles.countryRow, {
          opacity: anim,
          transform: [{ translateX: anim.interpolate({ inputRange: [0,1], outputRange: [40, 0] }) }],
        }]}>
          <Text style={styles.countryFlag}>{c.flag}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.countryName}>{c.name}</Text>
            <Text style={styles.countrySub}>{c.stories} Stories · {c.travelers} Reisende</Text>
          </View>
          <LinearGradient colors={gradients.brand} style={styles.countryBtn}>
            <Text style={styles.countryBtnText}>Ansehen</Text>
          </LinearGradient>
        </Animated.View>
      ))}
      <View style={{ height: 120 }} />
    </ScrollView>
  )
}

export default function MapScreen() {
  const [page, setPage] = useState(0)
  const scrollRef = useRef<ScrollView>(null)
  const indicatorAnim = useRef(new Animated.Value(0)).current

  const goToPage = (p: number) => {
    scrollRef.current?.scrollTo({ x: p * width, animated: true })
    Animated.spring(indicatorAnim, { toValue: p, useNativeDriver: true }).start()
    setPage(p)
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0d47a1' }}>
      {/* Page tabs */}
      <View style={styles.pageTabs}>
        {['🌍 Globus', '📖 Stories'].map((label, i) => (
          <Pressable key={i} style={[styles.pageTab, page === i && styles.pageTabActive]} onPress={() => goToPage(i)}>
            <Text style={[styles.pageTabText, page === i && styles.pageTabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        <View style={{ width }}>
          <GlobePage />
        </View>
        <View style={{ width }}>
          <StoriesPage />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  pageContent: { paddingBottom: 40 },
  pageTabs: { flexDirection: 'row', paddingTop: 56, paddingHorizontal: spacing.lg,
    paddingBottom: 8, gap: 8, backgroundColor: '#0d47a1', zIndex: 10 },
  pageTab: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)' },
  pageTabActive: { backgroundColor: 'rgba(255,255,255,0.28)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  pageTabText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  pageTabTextActive: { color: '#fff' },
  globeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 12, marginBottom: 4 },
  storiesHeader: { paddingHorizontal: spacing.lg, paddingTop: 12, marginBottom: 8 },
  globeTitle: { fontSize: 26, fontWeight: '900', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  globeSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', paddingHorizontal: spacing.lg, marginBottom: 12 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80' },
  liveText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  globeWrap: { alignItems: 'center', paddingVertical: 10, position: 'relative' },
  pin: { position: 'absolute', alignItems: 'center' },
  pinDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff', marginBottom: 2 },
  pinLabel: { fontSize: 9, color: '#fff', fontWeight: '800', backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  nearSection: { marginHorizontal: spacing.lg, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  gpsBtn: { borderRadius: 50, padding: 12, alignItems: 'center', marginTop: 10 },
  gpsBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: '#fff', marginBottom: 4 },
  sectionSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  sectionTitle2: { fontSize: 15, fontWeight: '900', color: '#fff',
    paddingHorizontal: spacing.lg, marginBottom: 10, marginTop: 4 },
  storyCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 18, padding: 14, marginHorizontal: spacing.lg, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  storyAvatarRing: { width: 48, height: 48, borderRadius: 24, borderWidth: 3,
    justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  storyAvatar: { fontSize: 24 },
  storyInfo: { flex: 1 },
  storyTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  storyUser: { fontSize: 14, fontWeight: '800', color: '#1a1a2e' },
  storyTime: { fontSize: 11, color: '#999' },
  storyLoc: { fontSize: 11, color: '#666', marginBottom: 4 },
  storyText: { fontSize: 13, color: '#333', lineHeight: 18 },
  countryRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16, padding: 14, marginHorizontal: spacing.lg, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  countryFlag: { fontSize: 32, marginRight: 12 },
  countryName: { fontSize: 15, fontWeight: '800', color: '#1a1a2e' },
  countrySub: { fontSize: 12, color: '#666' },
  countryBtn: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  countryBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
})
