import { colors, gradients, spacing } from '../constants/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { supabase } from '../lib/supabase'
import { Alert } from 'react-native'

const FEATURES = [
  { icon: '♥', title: 'Unbegrenzte Likes', desc: 'Swipen ohne Tageslimit' },
  { icon: '👁', title: 'Wer hat mich geliked', desc: 'Sieh alle die dich geliked haben' },
  { icon: '↩', title: 'Rückgängig-Swipe', desc: 'Letzten Swipe zurücknehmen' },
  { icon: '⭐', title: 'Super-Like', desc: 'Hebe dich beim anderen hervor' },
  { icon: '🚀', title: 'Profil-Boost', desc: '30 Min. ganz oben in der Liste' },
  { icon: '∞', title: 'Unbegrenzte Gruppen', desc: 'Erstelle so viele Gruppen du willst' },
]

interface Props {
  visible: boolean
  onClose: () => void
  userId: string
  onUpgraded?: () => void
}

export default function PremiumModal({ visible, onClose, userId, onUpgraded }: Props) {
  const handleUpgrade = async () => {
    // Simulate premium upgrade (real payment integration needed later)
    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: true } as any)
      .eq('id', userId)
    if (error) {
      Alert.alert('Fehler', 'Upgrade fehlgeschlagen.')
      return
    }
    Alert.alert('⭐ Premium aktiviert!', 'Du hast jetzt Zugang zu allen Premium-Funktionen.', [
      { text: 'Super!', onPress: () => { onClose(); onUpgraded?.() } },
    ])
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <LinearGradient colors={['#1a0a2e', '#0d1b2e', '#1a1a0a']} style={styles.bg}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.crown}>👑</Text>
              <Text style={styles.title}>Travel Buddy Premium</Text>
              <Text style={styles.subtitle}>Hol das Beste aus deiner Reise heraus</Text>
            </View>

            {/* Features */}
            <View style={styles.features}>
              {FEATURES.map(f => (
                <View key={f.title} style={styles.featureRow}>
                  <LinearGradient colors={gradients.brand} style={styles.featureIcon}>
                    <Text style={styles.featureIconText}>{f.icon}</Text>
                  </LinearGradient>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureDesc}>{f.desc}</Text>
                  </View>
                  <Text style={styles.featureCheck}>✓</Text>
                </View>
              ))}
            </View>

            {/* Pricing */}
            <View style={styles.pricing}>
              <LinearGradient colors={gradients.brand} style={styles.pricingCard}>
                <Text style={styles.pricingLabel}>MONATLICH</Text>
                <Text style={styles.pricingPrice}>9,99 €</Text>
                <Text style={styles.pricingPer}>/ Monat</Text>
              </LinearGradient>
              <View style={styles.pricingCardBest}>
                <View style={styles.bestBadge}><Text style={styles.bestBadgeText}>BELIEBT</Text></View>
                <Text style={styles.pricingLabel}>JÄHRLICH</Text>
                <Text style={styles.pricingPrice}>4,99 €</Text>
                <Text style={styles.pricingPer}>/ Monat · 59,99 € / Jahr</Text>
              </View>
            </View>

            {/* CTA */}
            <Pressable style={styles.cta} onPress={handleUpgrade}>
              <LinearGradient colors={gradients.brand} style={styles.ctaGrad}>
                <Text style={styles.ctaText}>👑 Premium aktivieren</Text>
              </LinearGradient>
            </Pressable>

            <Text style={styles.legal}>Jederzeit kündbar · Keine Bindung</Text>

            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Vielleicht später</Text>
            </Pressable>

            <View style={{ height: 30 }} />
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bg: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  crown: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  features: { gap: 14, marginBottom: 28 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  featureIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  featureIconText: { fontSize: 18, color: '#fff' },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 2 },
  featureDesc: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  featureCheck: { fontSize: 16, color: '#4ade80', fontWeight: '900' },
  pricing: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  pricingCard: { flex: 1, borderRadius: 20, padding: 16, alignItems: 'center' },
  pricingCardBest: { flex: 1, borderRadius: 20, padding: 16, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 2, borderColor: 'rgba(255,140,0,0.6)',
    position: 'relative' },
  bestBadge: { position: 'absolute', top: -10, backgroundColor: colors.primary,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  bestBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  pricingLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1, marginBottom: 6 },
  pricingPrice: { fontSize: 28, fontWeight: '900', color: '#fff' },
  pricingPer: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2, textAlign: 'center' },
  cta: { borderRadius: 50, overflow: 'hidden', marginBottom: 14 },
  ctaGrad: { padding: 18, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '900', fontSize: 17 },
  legal: { textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 16 },
  closeBtn: { alignItems: 'center', padding: 12 },
  closeBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 15 },
})
