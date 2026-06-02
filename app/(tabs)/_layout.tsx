import { colors } from '@/src/constants/theme'
import { Tabs } from 'expo-router'
import { Text } from 'react-native'

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: { borderTopColor: colors.border },
    }}>
      <Tabs.Screen name="discover" options={{
        title: 'Entdecken',
        tabBarIcon: ({ focused }) => <Text style={{ fontSize: 20 }}>🔥</Text>
      }} />
      <Tabs.Screen name="matches" options={{
        title: 'Matches',
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>💬</Text>
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profil',
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text>
      }} />
      <Tabs.Screen name="premium" options={{
        title: 'Premium',
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>⭐</Text>
      }} />
    </Tabs>
  )
}
