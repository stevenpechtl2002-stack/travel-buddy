import { colors, gradients, spacing } from '../constants/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

export interface Filters {
  ageMin: number
  ageMax: number
  gender: 'all' | 'male' | 'female'
  destination: string
  origin: string
}

export const DEFAULT_FILTERS: Filters = {
  ageMin: 18,
  ageMax: 60,
  gender: 'all',
  destination: '',
  origin: '',
}

interface Props {
  visible: boolean
  filters: Filters
  onChange: (f: Filters) => void
  onClose: () => void
}

const AGES = Array.from({ length: 43 }, (_, i) => i + 18)

const POPULAR_DESTINATIONS = ['Thailand', 'Bali', 'Japan', 'Portugal', 'Marokko', 'Island', 'Australien', 'Mexiko', 'Spanien', 'Vietnam']
const COUNTRIES = ['Deutschland', 'Österreich', 'Schweiz', 'USA', 'Frankreich', 'Italien', 'Spanien', 'Türkei', 'Kanada', 'Australien']

export default function FilterModal({ visible, filters, onChange, onClose }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })

  const activeCount = [
    filters.gender !== 'all',
    filters.destination !== '',
    filters.origin !== '',
    filters.ageMin !== 18 || filters.ageMax !== 60,
  ].filter(Boolean).length

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={gradients.brand} style={styles.header}>
          <Text style={styles.headerTitle}>Filter</Text>
          {activeCount > 0 && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{activeCount} aktiv</Text>
            </View>
          )}
          <Pressable onPress={() => onChange(DEFAULT_FILTERS)}>
            <Text style={styles.resetText}>Zurücksetzen</Text>
          </Pressable>
        </LinearGradient>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>

          {/* Age */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎂 Alter</Text>
            <View style={styles.ageRow}>
              <View style={styles.ageBox}>
                <Text style={styles.ageLabel}>Von</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ageScroll} contentContainerStyle={styles.ageScrollInner}>
                  {AGES.map(a => (
                    <Pressable key={a} style={[styles.ageChip, filters.ageMin === a && styles.ageChipActive]}
                      onPress={() => set({ ageMin: Math.min(a, filters.ageMax) })}>
                      <Text style={[styles.ageChipText, filters.ageMin === a && styles.ageChipTextActive]}>{a}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <Text style={styles.ageDash}>–</Text>
              <View style={styles.ageBox}>
                <Text style={styles.ageLabel}>Bis</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ageScroll} contentContainerStyle={styles.ageScrollInner}>
                  {AGES.map(a => (
                    <Pressable key={a} style={[styles.ageChip, filters.ageMax === a && styles.ageChipActive]}
                      onPress={() => set({ ageMax: Math.max(a, filters.ageMin) })}>
                      <Text style={[styles.ageChipText, filters.ageMax === a && styles.ageChipTextActive]}>{a}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
            <Text style={styles.ageDisplay}>{filters.ageMin} – {filters.ageMax} Jahre</Text>
          </View>

          {/* Gender */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Geschlecht</Text>
            <View style={styles.genderRow}>
              {[
                { value: 'all', label: '🌍 Alle' },
                { value: 'female', label: '👩 Frauen' },
                { value: 'male', label: '👨 Männer' },
              ].map(g => (
                <Pressable key={g.value} style={[styles.genderChip, filters.gender === g.value && styles.genderChipActive]}
                  onPress={() => set({ gender: g.value as Filters['gender'] })}>
                  {filters.gender === g.value
                    ? <LinearGradient colors={gradients.brandH} style={styles.genderGrad}>
                        <Text style={styles.genderTextActive}>{g.label}</Text>
                      </LinearGradient>
                    : <Text style={styles.genderText}>{g.label}</Text>
                  }
                </Pressable>
              ))}
            </View>
          </View>

          {/* Destination */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌍 Wunschziel</Text>
            <TextInput
              style={styles.input}
              placeholder="z.B. Thailand, Japan..."
              placeholderTextColor={colors.textMuted}
              value={filters.destination}
              onChangeText={t => set({ destination: t })}
            />
            <View style={styles.quickChips}>
              {POPULAR_DESTINATIONS.map(d => (
                <Pressable key={d} style={[styles.quickChip, filters.destination === d && styles.quickChipActive]}
                  onPress={() => set({ destination: filters.destination === d ? '' : d })}>
                  <Text style={[styles.quickChipText, filters.destination === d && styles.quickChipTextActive]}>{d}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Origin */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏠 Herkunft</Text>
            <TextInput
              style={styles.input}
              placeholder="z.B. Deutschland, USA..."
              placeholderTextColor={colors.textMuted}
              value={filters.origin}
              onChangeText={t => set({ origin: t })}
            />
            <View style={styles.quickChips}>
              {COUNTRIES.map(c => (
                <Pressable key={c} style={[styles.quickChip, filters.origin === c && styles.quickChipActive]}
                  onPress={() => set({ origin: filters.origin === c ? '' : c })}>
                  <Text style={[styles.quickChipText, filters.origin === c && styles.quickChipTextActive]}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Apply button */}
        <Pressable style={styles.applyBtn} onPress={onClose}>
          <LinearGradient colors={gradients.brand} style={styles.applyGrad}>
            <Text style={styles.applyText}>✓ Filter anwenden</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, paddingTop: 20, gap: 10 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', flex: 1 },
  activeBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  activeBadgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  resetText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '700' },
  content: { flex: 1 },
  contentInner: { padding: spacing.lg, gap: 8 },
  section: { backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.textMuted,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 },
  ageRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ageBox: { flex: 1 },
  ageLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 6 },
  ageScroll: { maxHeight: 40 },
  ageScrollInner: { gap: 6, paddingRight: 8 },
  ageChip: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceLight,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  ageChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  ageChipText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  ageChipTextActive: { color: '#fff' },
  ageDash: { fontSize: 18, color: colors.textMuted, paddingTop: 20 },
  ageDisplay: { textAlign: 'center', color: colors.primary, fontWeight: '800',
    fontSize: 15, marginTop: 10 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderChip: { flex: 1, borderRadius: 50, overflow: 'hidden',
    backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border },
  genderChipActive: { borderColor: 'transparent' },
  genderGrad: { paddingVertical: 12, alignItems: 'center' },
  genderText: { color: colors.textMuted, fontWeight: '700', fontSize: 13,
    textAlign: 'center', paddingVertical: 12 },
  genderTextActive: { color: '#fff', fontWeight: '800', fontSize: 13 },
  input: { backgroundColor: colors.surfaceLight, borderRadius: 14, padding: 14,
    color: colors.text, fontSize: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  quickChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: { backgroundColor: colors.surfaceLight, borderRadius: 50,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  quickChipActive: { borderColor: colors.primary, backgroundColor: 'rgba(255,140,0,0.15)' },
  quickChipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  quickChipTextActive: { color: colors.primary },
  applyBtn: { margin: spacing.lg, borderRadius: 50, overflow: 'hidden' },
  applyGrad: { padding: 18, alignItems: 'center' },
  applyText: { color: '#fff', fontWeight: '900', fontSize: 17 },
})
