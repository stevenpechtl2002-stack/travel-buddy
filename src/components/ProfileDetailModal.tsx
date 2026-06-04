import { colors, gradients, spacing } from '../constants/theme'
import { Profile, TravelDestination, UserInterest } from '../types'
import { Dimensions, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useState, useRef } from 'react'

const { width, height } = Dimensions.get('window')

const TRAVEL_STYLE_LABELS: Record<string, string> = {
  backpacker: '🏕️ Backpacker',
  luxury: '🥂 Luxury',
  city: '🏙️ City',
  adventure: '⛰️ Adventure',
  beach: '🏖️ Beach',
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

export default function ProfileDetailModal({ visible, profile, destinations, interests, extraImages, onClose, onSwipeLeft, onSwipeRight }: Props) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const scrollRef = useRef<ScrollView>(null)

  const photos: string[] = extraImages && extraImages.length > 0
    ? extraImages
    : profile.profile_image_url ? [profile.profile_image_url] : []

  const goTo = (i: number) => {
    setPhotoIndex(i)
    scrollRef.current?.scrollTo({ x: i * width, animated: true })
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Photo carousel */}
        <View style={styles.photoContainer}>
          {photos.length > 0 ? (
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => {
                const i = Math.round(e.nativeEvent.contentOffset.x / width)
                setPhotoIndex(i)
              }}
              style={styles.photoScroll}
            >
              {photos.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.photo} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : (
            <LinearGradient colors={gradients.brand} style={styles.photo}>
              <Text style={{ fontSize: 80 }}>👤</Text>
            </LinearGradient>
          )}

          {/* Dot indicators */}
          {photos.length > 1 && (
            <View style={styles.dots}>
              {photos.map((_, i) => (
                <Pressable key={i} onPress={() => goTo(i)}>
                  <View style={[styles.dot, i === photoIndex && styles.dotActive]} />
                </Pressable>
              ))}
            </View>
          )}

          {/* Left / right tap zones */}
          {photos.length > 1 && (
            <>
              <Pressable style={styles.tapLeft} onPress={() => goTo(Math.max(0, photoIndex - 1))} />
              <Pressable style={styles.tapRight} onPress={() => goTo(Math.min(photos.length - 1, photoIndex + 1))} />
            </>
          )}

          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.photoOverlay}>
            <Text style={styles.photoName}>{profile.name}, {profile.age}</Text>
            {profile.country ? <Text style={styles.photoCountry}>📍 {profile.country}</Text> : null}
          </LinearGradient>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
          {profile.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✅ Verifiziert</Text>
            </View>
          )}
          {photos.length > 1 && (
            <View style={styles.photoCount}>
              <Text style={styles.photoCountText}>{photoIndex + 1} / {photos.length}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
          {/* Bio */}
          {profile.bio ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>💬 Über mich</Text>
              <Text style={styles.bio}>"{profile.bio}"</Text>
            </View>
          ) : null}

          {/* Travel style */}
          {profile.travel_style ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>🎒 Reisestil</Text>
              <View style={styles.styleChip}>
                <Text style={styles.styleText}>{TRAVEL_STYLE_LABELS[profile.travel_style] ?? profile.travel_style}</Text>
              </View>
            </View>
          ) : null}

          {/* Destinations */}
          {destinations.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>🌍 Reiseziele</Text>
              <View style={styles.chips}>
                {destinations.map(d => (
                  <LinearGradient key={d.id} colors={['rgba(255,140,0,0.2)', 'rgba(255,77,109,0.15)']}
                    style={styles.destChip}>
                    <Text style={styles.destText}>🗺 {d.city ? `${d.city}, ` : ''}{d.country}</Text>
                    {d.date_from ? <Text style={styles.destDate}>{d.date_from}</Text> : null}
                  </LinearGradient>
                ))}
              </View>
            </View>
          )}

          {/* Interests */}
          {interests.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>🎯 Interessen</Text>
              <View style={styles.interestChips}>
                {interests.map(i => (
                  <View key={i.interest} style={styles.interestChip}>
                    <Text style={styles.interestText}>{i.interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Action buttons */}
        <View style={styles.actions}>
          <Pressable style={styles.nopeBtn} onPress={() => { onClose(); setTimeout(onSwipeLeft, 200) }}>
            <Text style={styles.nopeBtnText}>✕ Nope</Text>
          </Pressable>
          <Pressable style={styles.likeBtn} onPress={() => { onClose(); setTimeout(onSwipeRight, 200) }}>
            <LinearGradient colors={gradients.brandH} style={styles.likeBtnGrad}>
              <Text style={styles.likeBtnText}>♥ Like</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  photoContainer: { height: height * 0.45, position: 'relative', overflow: 'hidden' },
  photoScroll: { width: '100%', height: '100%' },
  photo: { width, height: height * 0.45, justifyContent: 'center', alignItems: 'center' },
  dots: { position: 'absolute', top: 12, left: 0, right: 0, flexDirection: 'row',
    justifyContent: 'center', gap: 5, zIndex: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { backgroundColor: '#fff', width: 18, borderRadius: 3 },
  tapLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%', zIndex: 5 },
  tapRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', zIndex: 5 },
  photoCount: { position: 'absolute', bottom: 60, right: 14,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3 },
  photoCountText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  photoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, paddingTop: 60 },
  photoName: { fontSize: 30, fontWeight: '900', color: '#fff' },
  photoCountry: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  closeBtn: { position: 'absolute', top: 16, right: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  verifiedBadge: { position: 'absolute', top: 16, left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5 },
  verifiedText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  content: { flex: 1 },
  contentInner: { padding: spacing.lg, gap: 12 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border },
  cardLabel: { fontSize: 11, fontWeight: '800', color: colors.textMuted,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  bio: { fontSize: 15, color: colors.text, lineHeight: 23, fontStyle: 'italic' },
  styleChip: { backgroundColor: 'rgba(255,140,0,0.15)', borderRadius: 50,
    alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,140,0,0.3)' },
  styleText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  chips: { gap: 8 },
  destChip: { borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(255,140,0,0.2)' },
  destText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  destDate: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  interestChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: { backgroundColor: colors.surfaceLight, borderRadius: 50,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  interestText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, padding: spacing.lg, paddingBottom: 34 },
  nopeBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: 50, padding: 16,
    alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,71,87,0.35)' },
  nopeBtnText: { color: '#ff4757', fontWeight: '800', fontSize: 16 },
  likeBtn: { flex: 1, borderRadius: 50, overflow: 'hidden' },
  likeBtnGrad: { padding: 16, alignItems: 'center' },
  likeBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
})
