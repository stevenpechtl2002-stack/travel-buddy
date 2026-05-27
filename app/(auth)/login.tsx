import { colors, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Fehler', 'Bitte E-Mail und Passwort eingeben')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) Alert.alert('Fehler', error.message)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Travel Buddy</Text>
      <Text style={styles.subtitle}>Finde deinen Reisepartner</Text>
      <TextInput style={styles.input} placeholder="E-Mail" value={email}
        onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Passwort" value={password}
        onChangeText={setPassword} secureTextEntry />
      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Laden...' : 'Anmelden'}</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.link}>Noch kein Konto? Registrieren</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl,
    backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: 'bold', color: colors.primary,
    textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { fontSize: 16, color: colors.textMuted, textAlign: 'center',
    marginBottom: spacing.xl },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    padding: spacing.md, marginBottom: spacing.md, fontSize: 16 },
  button: { backgroundColor: colors.primary, borderRadius: 12,
    padding: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { color: colors.primary, textAlign: 'center', fontSize: 14 },
})
