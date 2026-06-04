import SceneBackground from '@/src/components/SceneBackground'
import { colors, radius, spacing } from '@/src/constants/theme'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

const FEATURES = [
  '✅ Unbegrenzte Likes',
  '✅ Sehen wer mich geliked hat',
  '✅ Super-Like Feature',
  '✅ Unbegrenzter Chat',
]

export default function PremiumScreen() {
  const handleUpgrade = () => {
    Alert.alert('Upgrade', 'In-App Kauf wird gestartet...\n(RevenueCat Integration benötigt)')
  }

  return (
    <SceneBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Buddy Pro ⭐</Text>
        <Text style={styles.subtitle}>Das volle Travel Buddy Erlebnis</Text>
        <View style={styles.featureList}>
          {FEATURES.map(f => (
            <Text key={f} style={styles.feature}>{f}</Text>
          ))}
        </View>
        <View style={styles.priceCard}>
          <Text style={styles.price}>9,99€ / Monat</Text>
          <Pressable style={styles.upgradeBtn} onPress={handleUpgrade}
            accessibilityRole="button" accessibilityLabel="Jetzt upgraden">
            <Text style={styles.upgradeBtnText}>Jetzt upgraden</Text>
          </Pressable>
          <Text style={styles.legal}>Jederzeit kündbar. Automatische Verlängerung.</Text>
        </View>
      </ScrollView>
    </SceneBackground>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, justifyContent: 'center', flexGrow: 1 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff',
    textAlign: 'center', marginBottom: spacing.sm, marginTop: spacing.xl * 2,
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)',
    textAlign: 'center', marginBottom: spacing.xl },
  featureList: { backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 20,
    padding: spacing.lg, marginBottom: spacing.xl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  feature: { fontSize: 16, color: '#1a1a2e', fontWeight: '600', marginBottom: spacing.sm },
  priceCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: radius.lg,
    padding: spacing.xl, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  price: { fontSize: 24, fontWeight: 'bold', color: colors.primary,
    marginBottom: spacing.lg },
  upgradeBtn: { backgroundColor: colors.primary, borderRadius: radius.md, width: '100%',
    padding: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  upgradeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  legal: { fontSize: 11, color: '#888', textAlign: 'center' },
})
