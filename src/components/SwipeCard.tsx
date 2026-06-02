import { colors, radius, spacing } from '../constants/theme'
import { Profile, TravelDestination, UserInterest } from '../types'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

interface Props {
  profile: Profile
  destinations: TravelDestination[]
  interests: UserInterest[]
  onSwipeLeft: () => void
  onSwipeRight: () => void
}

export default function SwipeCard({ profile, destinations, interests, onSwipeLeft, onSwipeRight }: Props) {
  const topDest = destinations[0]
  const topInterests = interests.slice(0, 3).map(i => i.interest)

  return (
    <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.card}>
      {/* Tap zones: left half = skip, right half = like */}
      <View style={styles.tapZones} pointerEvents="box-none">
        <Pressable style={styles.tapLeft} onPress={onSwipeLeft} accessibilityLabel="Profil überspringen" accessibilityRole="button" />
        <Pressable style={styles.tapRight} onPress={onSwipeRight} accessibilityLabel="Profil liken" accessibilityRole="button" />
      </View>

      {profile.profile_image_url ? (
        <Image source={{ uri: profile.profile_image_url }} style={styles.avatar} accessibilityLabel={`Profilfoto von ${profile.name}`} />
      ) : (
        <View style={styles.avatarPlaceholder} accessibilityRole="image" accessibilityLabel="Kein Profilfoto">
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{profile.name}, {profile.age}</Text>
        {topDest && (
          <Text style={styles.destination}>
            🌍 {topDest.country}{topDest.city ? ` · ${topDest.city}` : ''}
          </Text>
        )}
        {profile.travel_style && (
          <Text style={styles.detail}>🎒 {profile.travel_style}</Text>
        )}
        {topInterests.length > 0 && (
          <Text style={styles.detail}>{topInterests.join(' · ')}</Text>
        )}
        {profile.bio ? <Text style={styles.bio}>"{profile.bio}"</Text> : null}
        {profile.verified && <Text style={styles.verified}>✅ Verifiziert</Text>}
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.lg, minHeight: 320,
    justifyContent: 'flex-end' },
  tapZones: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row', zIndex: 1 },
  tapLeft: { flex: 1 },
  tapRight: { flex: 1 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: spacing.md,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center',
    alignItems: 'center', marginBottom: spacing.md },
  avatarEmoji: { fontSize: 32 },
  info: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.md,
    padding: spacing.md },
  name: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  destination: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
  detail: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  bio: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', marginTop: 4 },
  verified: { fontSize: 12, color: '#fff', marginTop: 4 },
})
