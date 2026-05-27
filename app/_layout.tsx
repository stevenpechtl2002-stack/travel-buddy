import { useAuth } from '@/src/hooks/useAuth'
import { useProfile } from '@/src/hooks/useProfile'
import { Slot, useRouter, useSegments } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'

export default function RootLayout() {
  const { session, loading } = useAuth()
  const { getFullProfile } = useProfile()
  const segments = useSegments()
  const router = useRouter()
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null)

  useEffect(() => {
    if (loading || !session) {
      setOnboardingComplete(null)
      return
    }
    getFullProfile(session.user.id).then(({ profile }) => {
      setOnboardingComplete(profile?.onboarding_complete ?? false)
    })
  }, [session, loading])

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === '(auth)'
    const inOnboarding = segments[0] === 'onboarding'

    if (!session && !inAuth) {
      router.replace('/(auth)/login')
    } else if (session && inAuth) {
      // Wait for onboarding check
      if (onboardingComplete === null) return
      if (onboardingComplete) router.replace('/(tabs)/discover')
      else router.replace('/onboarding/basics')
    } else if (session && !inAuth && !inOnboarding && onboardingComplete === false) {
      router.replace('/onboarding/basics')
    }
  }, [session, loading, segments, router, onboardingComplete])

  if (loading || (session && onboardingComplete === null)) {
    return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>
  }
  return <Slot />
}
