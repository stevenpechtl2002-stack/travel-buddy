import { colors, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { useProfile } from '@/src/hooks/useProfile'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native'

const ALL_INTERESTS = [
  '🏄 Surfen', '🥾 Wandern', '📸 Fotografie', '🎵 Musik', '🍜 Essen',
  '🎉 Nightlife', '🏋️ Sport', '📚 Lesen', '🎨 Kunst', '🌿 Natur',
  '🏊 Schwimmen', '🚴 Radfahren', '🧘 Yoga', '🎮 Gaming', '✈️ Abenteuer',
]

export default function InterestsScreen() {
  const [selected, setSelected] = useState<string[]>([])
  const { session } = useAuth()
  const { setInterests } = useProfile()
  const router = useRouter()

  const toggle = (interest: string) =>
    setSelected(prev => prev.includes(interest)
      ? prev.filter(i => i !== interest)
      : [...prev, interest])

  const handleNext = async () => {
    if (selected.length < 3) return Alert.alert('Bitte mindestens 3 Interessen wählen')
    if (!session) return
    const { error } = await setInterests(session.user.id, selected)
    if (error) return Alert.alert('Fehler', 'Speichern fehlgeschlagen')
    router.push('/onboarding/bio')
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Deine Interessen</Text>
      <Text style={styles.subtitle}>Wähle mindestens 3</Text>
      <View style={styles.grid}>
        {ALL_INTERESTS.map(interest => (
          <Pressable key={interest}
            style={[styles.chip, selected.includes(interest) && styles.chipSelected]}
            onPress={() => toggle(interest)}>
            <Text style={[styles.chipText, selected.includes(interest) && styles.chipTextSelected]}>
              {interest}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Weiter →</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.primary,
    textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center',
    marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.xl },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 9999,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipSelected: { borderColor: colors.primary, backgroundColor: '#fff3e0' },
  chipText: { fontSize: 14, color: colors.text },
  chipTextSelected: { color: colors.primary, fontWeight: 'bold' },
  button: { backgroundColor: colors.primary, borderRadius: 12,
    padding: spacing.md, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})
