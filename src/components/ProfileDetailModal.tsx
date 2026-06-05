import { colors, gradients, spacing } from '../constants/theme'
import { Profile, TravelDestination, UserInterest } from '../types'
import {
  Animated, Dimensions, Image, ImageSourcePropType, Modal,
  Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRef, useState, useEffect } from 'react'

const { width, height } = Dimensions.get('window')
const PHOTO_H = height * 0.58

const DEMO_IMAGES: Record<string, any> = {
  'demo-1':  require('../../assets/demo/laura.jpg'),
  'demo-2':  require('../../assets/demo/max.jpg'),
  'demo-3':  require('../../assets/demo/sofia.jpg'),
  'demo-4':  require('../../assets/demo/jonas.jpg'),
  'demo-5':  require('../../assets/demo/mia.jpg'),
  'demo-6':  require('../../assets/demo/luca.jpg'),
  'demo-7':  require('../../assets/demo/emma.jpg'),
  'demo-8':  require('../../assets/demo/noah.jpg'),
  'demo-9':  require('../../assets/demo/yuki.jpg'),
  'demo-10': require('../../assets/demo/ali.jpg'),
  'demo-11': require('../../assets/demo/chloe.jpg'),
  'demo-12': require('../../assets/demo/finn.jpg'),
  'demo-13': require('../../assets/demo/amara.jpg'),
  'demo-14': require('../../assets/demo/carlos.jpg'),
  'demo-15': require('../../assets/demo/anna.jpg'),
  'demo-16': require('../../assets/demo/ben.jpg'),
  'demo-17': require('../../assets/demo/priya.jpg'),
}

const FALLBACK_IMAGES = [
  require('../../assets/demo/laura.jpg'),
  require('../../assets/demo/max.jpg'),
  require('../../assets/demo/sofia.jpg'),
  require('../../assets/demo/jonas.jpg'),
  require('../../assets/demo/mia.jpg'),
  require('../../assets/demo/luca.jpg'),
  require('../../assets/demo/emma.jpg'),
  require('../../assets/demo/noah.jpg'),
]

function getFallback(id: string) {
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0
  return FALLBACK_IMAGES[Math.abs(h) % FALLBACK_IMAGES.length]
}

const TRAVEL_STYLE_LABELS: Record<string, string> = {
  backpacker: '🏕 Backpacker',
  luxury: '🥂 Luxury',
  city: '🏙 City',
  adventure: '⛰ Adventure',
  beach: '🏖 Beach',
}

interface Props {
  visible: boolean
  profile: Profile
  destinations: TravelDestination[]
  interests: UserInterest[]
  extraImages?: string[]
  onClose: () => void
  onSwipeLeft: () => void
  onSwipeRight: () => void
}

export default function ProfileDetailModal({
  visible, profile, destinations, interests, extraImages,
  onClose, onSwipeLeft, onSwipeRight,
}: Props) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const fadeAnim = useRef(new Animated.Value(1)).current

  // Build the photos array: demo image first, then extras, then URL
  const sources: ImageSourcePropType[] = []
  if (DEMO_IMAGES[profile.id]) {
    sources.push(DEMO_IMAGES[profile.id])
  } else if (profile.profile_image_url) {
    sources.push({ uri: profile.profile_image_url })
  } else {
    sources.push(getFallback(profile.id))
  }
  if (extraImages) {
    extraImages.forEach(uri => sources.push({ uri }))
  }

  // Reset photo index when modal opens
  useEffect(() => { if (visible) setPhotoIndex(0) }, [visible])

  const goTo = (i: number) => {
    if (i < 0 || i >= sources.length || i === photoIndex) return
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start()
    setPhotoIndex(i)
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces
        >
          {/* ── PHOTO HEADER (scrolls away with content) ── */}
          <View style={styles.photoWrap}>
            <Animated.Image
              source={sources[photoIndex]}
              style={[styles.photo, { opacity: fadeAnim }]}
              resizeMode="cover"
            />

            {/* Left tap zone */}
            {sources.length > 1 && (
              <Pressable style={styles.tapLeft} onPress={() => goTo(photoIndex - 1)} />
            )}
            {/* Right tap zone */}
            {sources.length > 1 && (
              <Pressable style={styles.tapRight} onPress={() => goTo(photoIndex + 1)} />
            )}

            {/* Progress dots (Instagram-style top bar) */}
            {sources.length > 1 && (
              <View style={styles.dots}>
                {sources.map((_, i) => (
                  <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
                ))}
              </View>
            )}

            {/* Photo counter */}
            {sources.length > 1 && (
              <View style={styles.counter}>
                <Text style={styles.counterText}>{photoIndex + 1} / {sources.length}</Text>
              </View>
            )}

            {/* Close button */}
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <View style={styles.closeBtnInner}>
                <Text style={styles.closeBtnText}>✕</Text>
              </View>
            </Pressable>

            {/* Verified badge */}
            {profile.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verifiziert</Text>
              </View>
            )}

            {/* Name / location overlay fades in from bottom */}
            <LinearGradient
              colors={['transparent', 'rgba(8,10,20,0.92)']}
              style={styles.photoOverlay}
            >
              <Text style={styles.photoName}>{profile.name}, {profile.age}</Text>
              {profile.country
                ? <Text style={styles.photoCountry}>📍 {profile.country}</Text>
                : null}
              {destinations.length > 0 && (
                <View style={styles.destRow}>
                  {destinations.slice(0, 3).map(d => (
                    <View key={d.id} style={styles.destChipSmall}>
                      <Text style={styles.destChipText}>🌍 {d.city ?? d.country}</Text>
                    </View>
                  ))}
                </View>
              )}
            </LinearGradient>
          </View>

          {/* ── SCROLL-UP INDICATOR ── */}
          <View style={styles.scrollHint}>
            <View style={styles.scrollHintBar} />
            <Text style={styles.scrollHintText}>Nach oben ziehen für mehr Infos</Text>
          </View>

          {/* ── INFO CARDS ── */}
          <View style={styles.cards}>
            {profile.bio ? (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Über mich</Text>
                <Text style={styles.bio}>"{profile.bio}"</Text>
              </View>
            ) : null}

            {profile.travel_style ? (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Reisestil</Text>
                <View style={styles.styleChip}>
                  <Text style={styles.styleText}>
                    {TRAVEL_STYLE_LABELS[profile.travel_style] ?? profile.travel_style}
                  </Text>
                </View>
              </View>
            ) : null}

            {destinations.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Reiseziele</Text>
                <View style={styles.destList}>
                  {destinations.map(d => (
                    <LinearGradient
                      key={d.id}
                      colors={['rgba(232,132,92,0.15)', 'rgba(201,86,110,0.1)']}
                      style={styles.destItem}
                    >
                      <Text style={styles.destItemText}>
                        🗺 {d.city ? `${d.city}, ` : ''}{d.country}
                      </Text>
                      {d.date_from
                        ? <Text style={styles.destItemDate}>{d.date_from}</Text>
                        : null}
                    </LinearGradient>
                  ))}
                </View>
              </View>
            )}

            {interests.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Interessen</Text>
                <View style={styles.interestWrap}>
                  {interests.map(i => (
                    <View key={i.interest} style={styles.interestChip}>
                      <Text style={styles.interestText}>{i.interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={{ height: 120 }} />
          </View>
        </ScrollView>

        {/* ── FIXED ACTION BUTTONS ── */}
        <View style={styles.actions}>
          <Pressable style={styles.nopeBtn} onPress={() => { onClose(); setTimeout(onSwipeLeft, 200) }}>
            <Text style={styles.nopeBtnText}>✕  Nope</Text>
          </Pressable>
          <Pressable style={styles.likeBtn} onPress={() => { onClose(); setTimeout(onSwipeRight, 200) }}>
            <LinearGradient colors={gradients.brand} style={styles.likeBtnGrad}>
              <Text style={styles.likeBtnText}>♥  Like</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 0 },

  // Photo
  photoWrap: { width, height: PHOTO_H, position: 'relative', overflow: 'hidden', backgroundColor: colors.surface },
  photo: { width: '100%', height: '100%' },

  // Tap zones (middle strip, below dots)
  tapLeft: { position: 'absolute', left: 0, top: 40, bottom: 80, width: '38%', zIndex: 5 },
  tapRight: { position: 'absolute', right: 0, top: 40, bottom: 80, width: '38%', zIndex: 5 },

  // Dots (Instagram-style top)
  dots: {
    position: 'absolute', top: 14, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 4, zIndex: 10,
  },
  dot: {
    height: 3, flex: 1, maxWidth: 40, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: { backgroundColor: '#fff' },

  // Counter badge
  counter: {
    position: 'absolute', top: 28, right: 14, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 12,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  counterText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Close
  closeBtn: { position: 'absolute', top: 20, left: 16, zIndex: 20 },
  closeBtnInner: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  closeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Verified
  verifiedBadge: {
    position: 'absolute', top: 20, right: 56, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  verifiedText: { color: '#4ade80', fontSize: 12, fontWeight: '800' },

  // Overlay gradient at bottom of photo
  photoOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.lg,
    zIndex: 6,
  },
  photoName: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 4 },
  photoCountry: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  destRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  destChipSmall: {
    backgroundColor: 'rgba(232,132,92,0.75)', borderRadius: 50,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  destChipText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Scroll hint
  scrollHint: {
    alignItems: 'center', paddingVertical: 12,
    backgroundColor: colors.background,
  },
  scrollHintBar: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(245,240,235,0.2)', marginBottom: 6,
  },
  scrollHintText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },

  // Info cards
  cards: { backgroundColor: colors.background, padding: spacing.lg, gap: 12 },
  card: {
    backgroundColor: colors.surface, borderRadius: 20, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  cardLabel: {
    fontSize: 10, fontWeight: '900', color: colors.textMuted,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12,
  },
  bio: { fontSize: 15, color: colors.text, lineHeight: 24, fontStyle: 'italic' },
  styleChip: {
    backgroundColor: 'rgba(232,132,92,0.15)', borderRadius: 50, alignSelf: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 9,
    borderWidth: 1, borderColor: 'rgba(232,132,92,0.3)',
  },
  styleText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  destList: { gap: 8 },
  destItem: { borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(232,132,92,0.2)' },
  destItemText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  destItemDate: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  interestWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: {
    backgroundColor: colors.surfaceLight, borderRadius: 50,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  interestText: { color: colors.text, fontSize: 13, fontWeight: '600' },

  // Action buttons
  actions: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: spacing.lg, paddingBottom: 36, paddingTop: 14,
    backgroundColor: colors.background,
    borderTopWidth: 1, borderColor: colors.border,
  },
  nopeBtn: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 50, padding: 16,
    alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(224,85,85,0.35)',
  },
  nopeBtnText: { color: '#e05555', fontWeight: '800', fontSize: 16 },
  likeBtn: { flex: 1, borderRadius: 50, overflow: 'hidden' },
  likeBtnGrad: { padding: 16, alignItems: 'center' },
  likeBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
})
