import { colors, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

export default function RegisterScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleRegister = async () => {
    if (!email || !password) return Alert.alert('Fehler', 'Bitte E-Mail und Passwort eingeben')
    if (password.length < 6) return Alert.alert('Fehler', 'Passwort muss mindestens 6 Zeichen haben')
    setLoading(true)
    const { error } = await signUp(email, password)
    setLoading(false)
    if (error) Alert.alert('Fehler', error.message)
    else router.replace('/onboarding/basics')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Konto erstellen</Text>
      <TextInput style={styles.input} placeholder="E-Mail" value={email}
        onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Passwort (min. 6 Zeichen)"
        value={password} onChangeText={setPassword} secureTextEntry />
      <Pressable style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Laden...' : 'Registrieren'}</Text>
      </Pressable>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.link}>Bereits ein Konto? Anmelden</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary,
    textAlign: 'center', marginBottom: spacing.xl },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    padding: spacing.md, marginBottom: spacing.md, fontSize: 16 },
  button: { backgroundColor: colors.primary, borderRadius: 12,
    padding: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { color: colors.primary, textAlign: 'center', fontSize: 14 },
})
