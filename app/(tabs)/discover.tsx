import MatchPopup from '@/src/components/MatchPopup'
import SwipeCard from '@/src/components/SwipeCard'
import { colors, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { useDiscover } from '@/src/hooks/useDiscover'
import { useSwipe } from '@/src/hooks/useSwipe'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'

export default function DiscoverScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const { candidates, loading, error, reload, removeTop } = useDiscover(userId)
  const { recordSwipe } = useSwipe(userId)
  const [matchInfo, setMatchInfo] = useState<{ name: string } | null>(null)
  const [processing, setProcessing] = useState(false)
  const router = useRouter()

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (processing) return
    const top = candidates[0]
    if (!top) return
    setProcessing(true)
    const { isMatch, error: swipeError } = await recordSwipe(top.profile.id, direction)
    if (swipeError) {
      Alert.alert('Fehler', 'Swipe konnte nicht gespeichert werden. Bitte versuche es erneut.')
      setProcessing(false)
      return
    }
    const remainingAfterRemove = candidates.length - 1
    removeTop()
    if (isMatch) setMatchInfo({ name: top.profile.name })
    if (remainingAfterRemove <= 3) reload()
    setProcessing(false)
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>

  if (error) return (
    <View style={styles.center}>
      <Text style={styles.emptyText}>❌ Fehler beim Laden</Text>
      <Pressable style={styles.reloadButton} onPress={reload}>
        <Text style={styles.reloadText}>Erneut versuchen</Text>
      </Pressable>
    </View>
  )

  if (candidates.length === 0) return (
    <View style={styles.center}>
      <Text style={styles.emptyText}>🌍 Keine neuen Reisenden gerade</Text>
      <Pressable style={styles.reloadButton} onPress={reload}>
        <Text style={styles.reloadText}>Aktualisieren</Text>
      </Pressable>
    </View>
  )

  const top = candidates[0]

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Travel Buddy</Text>
      <SwipeCard
        profile={top.profile}
        destinations={top.destinations}
        interests={top.interests}
        onSwipeLeft={() => handleSwipe('left')}
        onSwipeRight={() => handleSwipe('right')}
      />
      <View style={styles.buttons}>
        <Pressable style={[styles.skipBtn, processing && styles.btnDisabled]}
          onPress={() => handleSwipe('left')} disabled={processing}
          accessibilityLabel="Profil überspringen" accessibilityRole="button">
          <Text style={styles.skipBtnText}>✕</Text>
        </Pressable>
        <Pressable style={[styles.likeBtn, processing && styles.btnDisabled]}
          onPress={() => handleSwipe('right')} disabled={processing}
          accessibilityLabel="Profil liken" accessibilityRole="button">
          <Text style={styles.likeBtnText}>♥</Text>
        </Pressable>
      </View>
      <MatchPopup
        visible={!!matchInfo}
        matchName={matchInfo?.name ?? ''}
        onStartChat={() => { setMatchInfo(null); router.push('/(tabs)/matches') }}
        onClose={() => setMatchInfo(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', color: colors.primary,
    textAlign: 'center', marginBottom: spacing.md },
  buttons: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginTop: spacing.lg },
  skipBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  skipBtnText: { fontSize: 24, color: colors.textMuted },
  likeBtn: { width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  likeBtnText: { fontSize: 24, color: '#fff' },
  btnDisabled: { opacity: 0.5 },
  emptyText: { fontSize: 16, color: colors.textMuted, marginBottom: spacing.lg },
  reloadButton: { backgroundColor: colors.primary, borderRadius: 12,
    padding: spacing.md, alignItems: 'center' },
  reloadText: { color: '#fff', fontWeight: 'bold' },
})
