import { colors, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { useProfile } from '@/src/hooks/useProfile'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { supabase } from '@/src/lib/supabase'

export default function BasicsScreen() {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [country, setCountry] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { session } = useAuth()
  const { updateProfile } = useProfile()
  const router = useRouter()

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return Alert.alert('Berechtigung benötigt', 'Bitte erlaube den Zugriff auf deine Fotos.')
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    })
    if (!result.canceled) setImageUri(result.assets[0].uri)
  }

  const uploadImage = async (userId: string, uri: string) => {
    const response = await fetch(uri)
    const blob = await response.blob()
    const path = `${userId}/avatar.jpg`
    const { error } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  }

  const handleNext = async () => {
    if (!name || !age || !country) return Alert.alert('Bitte alle Felder ausfüllen')
    const n = parseInt(age)
    if (isNaN(n) || n < 13 || n > 120) return Alert.alert('Bitte ein gültiges Alter eingeben')
    if (!session) return
    setLoading(true)
    try {
      let profile_image_url: string | null = null
      if (imageUri) profile_image_url = await uploadImage(session.user.id, imageUri)
      const { error } = await updateProfile(session.user.id, {
        name, age: n, country, profile_image_url,
      })
      if (error) return Alert.alert('Fehler', 'Speichern fehlgeschlagen')
      router.push('/onboarding/destinations')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Erzähl uns von dir</Text>
      <Pressable style={styles.avatarPicker} onPress={pickImage}>
        {imageUri
          ? <Image source={{ uri: imageUri }} style={styles.avatar} />
          : <Text style={styles.avatarPlaceholder}>📷 Foto hinzufügen</Text>}
      </Pressable>
      <TextInput style={styles.input} placeholder="Dein Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Alter" value={age}
        onChangeText={setAge} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Herkunftsland (z.B. Deutschland)"
        value={country} onChangeText={setCountry} />
      <Pressable style={styles.button} onPress={handleNext} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Speichern...' : 'Weiter →'}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.primary,
    marginBottom: spacing.xl, textAlign: 'center' },
  avatarPicker: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surface,
    alignSelf: 'center', justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.lg, overflow: 'hidden' },
  avatar: { width: 100, height: 100 },
  avatarPlaceholder: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    padding: spacing.md, marginBottom: spacing.md, fontSize: 16 },
  button: { backgroundColor: colors.primary, borderRadius: 12,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.md },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})
