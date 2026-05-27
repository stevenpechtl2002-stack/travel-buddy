import { useAuth } from '@/src/hooks/useAuth'
import { Slot, useRouter, useSegments } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'

export default function RootLayout() {
  const { session, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === '(auth)'
    if (!session && !inAuth) router.replace('/(auth)/login')
    else if (session && inAuth) router.replace('/(tabs)/discover')
  }, [session, loading, segments, router])

  if (loading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>
  return <Slot />
}
