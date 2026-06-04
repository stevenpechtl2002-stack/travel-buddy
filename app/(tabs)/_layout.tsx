import SandDuneTabBar from '@/src/components/SandDuneTabBar'
import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <SandDuneTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="matches" />
      <Tabs.Screen name="groups" />
      <Tabs.Screen name="map" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="premium" options={{ href: null }} />
    </Tabs>
  )
}
