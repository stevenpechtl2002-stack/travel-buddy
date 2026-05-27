import { colors, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { useProfile } from '@/src/hooks/useProfile'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

const LANGUAGES = ['Deutsch', 'Englisch', 'Spanisch', 'Französisch', 'Italienisch',
  'Portugiesisch', 'Japanisch', 'Chinesisch', 'Arabisch']

export default function BioScreen() {
  const [bio, setBio] = useState('')
  const [selectedLangs, setSelectedLangs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { session } = useAuth()
  const { updateProfile } = useProfile()
  const router = useRouter()

  const toggleLang = (lang: string) =>
    setSelectedLangs(prev => prev.includes(lang)
      ? prev.filter(l => l !== lang)
      : [...prev, lang])

  const handleFinish = async () => {
    if (!session) return
    setLoading(true)
    await updateProfile(session.user.id, {
      bio, languages: selectedLangs, onboarding_complete: true,
    })
    setLoading(false)
    router.replace('/(tabs)/discover')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fast fertig!</Text>
      <Text style={styles.label}>Kurze Bio</Text>
      <TextInput style={styles.bioInput} placeholder="Erzähl anderen etwas über dich..."
        value={bio} onChangeText={setBio} multiline numberOfLines={4} />
      <Text style={styles.label}>Sprachen</Text>
      <View style={styles.grid}>
        {LANGUAGES.map(lang => (
          <Pressable key={lang}
            style={[styles.chip, selectedLangs.includes(lang) && styles.chipSelected]}
            onPress={() => toggleLang(lang)}>
            <Text style={[styles.chipText, selectedLangs.includes(lang) && styles.chipTextSelected]}>
              {lang}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.button} onPress={handleFinish} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Speichern...' : 'Los gehts! 🚀'}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.primary,
    marginBottom: spacing.lg, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: 'bold', color: colors.text,
    marginBottom: spacing.sm },
  bioInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    padding: spacing.md, fontSize: 15, minHeight: 100, textAlignVertical: 'top',
    marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.xl },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 9999,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipSelected: { borderColor: colors.primary, backgroundColor: '#fff3e0' },
  chipText: { fontSize: 13, color: colors.text },
  chipTextSelected: { color: colors.primary, fontWeight: 'bold' },
  button: { backgroundColor: colors.primary, borderRadius: 12,
    padding: spacing.md, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})
