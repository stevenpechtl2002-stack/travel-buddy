import { useAuth } from '@/src/hooks/useAuth'
import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'

export default function Index() {
  const { session, loading } = useAuth()

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#3b9de0' }}>
      <ActivityIndicator color="#fff" size="large" />
    </View>
  )

  if (session) return <Redirect href="/(tabs)/discover" />
  return <Redirect href="/(auth)/login" />
}
