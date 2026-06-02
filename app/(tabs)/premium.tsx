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
    <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.container}>
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
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.xl, justifyContent: 'center', flexGrow: 1 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff',
    textAlign: 'center', marginBottom: spacing.sm, marginTop: spacing.xl },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)',
    textAlign: 'center', marginBottom: spacing.xl },
  featureList: { marginBottom: spacing.xl },
  feature: { fontSize: 16, color: '#fff', marginBottom: spacing.sm },
  priceCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: radius.lg,
    padding: spacing.xl, alignItems: 'center' },
  price: { fontSize: 24, fontWeight: 'bold', color: colors.primary,
    marginBottom: spacing.lg },
  upgradeBtn: { backgroundColor: colors.primary, borderRadius: radius.md, width: '100%',
    padding: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  upgradeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  legal: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
})
