import { colors, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { useProfile } from '@/src/hooks/useProfile'
import { TravelStyle } from '@/src/types'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

const STYLES: { key: TravelStyle; label: string }[] = [
  { key: 'backpacker', label: '🎒 Backpacker' },
  { key: 'luxury', label: '✨ Luxus' },
  { key: 'city', label: '🏙️ Städtereise' },
  { key: 'adventure', label: '🏔️ Abenteuer' },
  { key: 'beach', label: '🏖️ Strandurlaub' },
]

export default function TravelStyleScreen() {
  const [selected, setSelected] = useState<TravelStyle | null>(null)
  const { session } = useAuth()
  const { updateProfile } = useProfile()
  const router = useRouter()

  const handleNext = async () => {
    if (!selected || !session) return
    const { error } = await updateProfile(session.user.id, { travel_style: selected })
    if (error) return Alert.alert('Fehler', 'Speichern fehlgeschlagen')
    router.push('/onboarding/interests')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dein Reisestil</Text>
      {STYLES.map(s => (
        <Pressable key={s.key}
          style={[styles.option, selected === s.key && styles.optionSelected]}
          onPress={() => setSelected(s.key)}>
          <Text style={[styles.optionText, selected === s.key && styles.optionTextSelected]}>
            {s.label}
          </Text>
        </Pressable>
      ))}
      <Pressable style={[styles.button, !selected && styles.buttonDisabled]}
        onPress={handleNext} disabled={!selected}>
        <Text style={styles.buttonText}>Weiter →</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.primary,
    marginBottom: spacing.xl, textAlign: 'center' },
  option: { borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    padding: spacing.md, marginBottom: spacing.sm },
  optionSelected: { borderColor: colors.primary, backgroundColor: '#fff3e0' },
  optionText: { fontSize: 16, color: colors.text },
  optionTextSelected: { color: colors.primary, fontWeight: 'bold' },
  button: { backgroundColor: colors.primary, borderRadius: 12,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})
