import { colors, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { useProfile } from '@/src/hooks/useProfile'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

export default function DestinationsScreen() {
  const [destinations, setDestinations] = useState([{ country: '', city: '', date_from: '', date_to: '' }])
  const { session } = useAuth()
  const { setDestinations: saveDestinations } = useProfile()
  const router = useRouter()

  const addDestination = () =>
    setDestinations(prev => [...prev, { country: '', city: '', date_from: '', date_to: '' }])

  const update = (i: number, field: string, val: string) =>
    setDestinations(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: val } : d))

  const handleNext = async () => {
    const filled = destinations.filter(d => d.country.trim())
    if (filled.length === 0) return Alert.alert('Mindestens ein Reiseziel eingeben')
    if (!session) return
    const { error } = await saveDestinations(session.user.id, filled.map(d => ({
      country: d.country,
      city: d.city || null,
      date_from: d.date_from || null,
      date_to: d.date_to || null,
    })))
    if (error) return Alert.alert('Fehler', 'Speichern fehlgeschlagen')
    router.push('/onboarding/travel-style')
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Wohin geht die Reise?</Text>
      {destinations.map((d, i) => (
        <View key={i} style={styles.card}>
          <TextInput style={styles.input} placeholder="Land (z.B. Thailand)"
            value={d.country} onChangeText={v => update(i, 'country', v)} />
          <TextInput style={styles.input} placeholder="Stadt (optional)"
            value={d.city} onChangeText={v => update(i, 'city', v)} />
          <TextInput style={styles.input} placeholder="Von (YYYY-MM-DD)"
            value={d.date_from} onChangeText={v => update(i, 'date_from', v)} />
          <TextInput style={styles.input} placeholder="Bis (YYYY-MM-DD)"
            value={d.date_to} onChangeText={v => update(i, 'date_to', v)} />
        </View>
      ))}
      <Pressable style={styles.addButton} onPress={addDestination}>
        <Text style={styles.addButtonText}>+ Weiteres Ziel</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Weiter →</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.primary,
    marginBottom: spacing.lg, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md,
    marginBottom: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    padding: spacing.sm, marginBottom: spacing.sm, fontSize: 15, backgroundColor: '#fff' },
  addButton: { borderWidth: 1, borderColor: colors.primary, borderRadius: 12,
    padding: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  addButtonText: { color: colors.primary, fontWeight: 'bold' },
  button: { backgroundColor: colors.primary, borderRadius: 12,
    padding: spacing.md, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})
