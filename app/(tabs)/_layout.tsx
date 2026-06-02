import { colors } from '@/src/constants/theme'
import { Tabs } from 'expo-router'
import { Text } from 'react-native'

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
    }}>
      <Tabs.Screen name="discover" options={{
        title: 'Entdecken',
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>🔥</Text>
      }} />
    </Tabs>
  )
}
