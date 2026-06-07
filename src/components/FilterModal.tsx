import { colors, gradients, spacing } from '../constants/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import NumberWheelPicker from './NumberWheelPicker'

export interface Filters {
  ageMin: number
  ageMax: number
  gender: 'all' | 'male' | 'female'
  religion: string
  destination: string
  origin: string
}

export const DEFAULT_FILTERS: Filters = {
  ageMin: 18,
  ageMax: 60,
  gender: 'all',
  religion: 'all',
  destination: '',
  origin: '',
}

interface Props {
  visible: boolean
  filters: Filters
  onChange: (f: Filters) => void
  onClose: () => void
}

const POPULAR_DESTINATIONS = ['Thailand', 'Bali', 'Japan', 'Portugal', 'Marokko', 'Island', 'Australien', 'Mexiko', 'Spanien', 'Vietnam']
const COUNTRIES = ['Deutschland', 'Österreich', 'Schweiz', 'USA', 'Frankreich', 'Italien', 'Spanien', 'Türkei', 'Kanada', 'Australien']

const RELIGION_OPTIONS = [
  { value: 'all', label: '🌍 Alle' },
  { value: 'Christlich', label: '✝️ Christlich' },
  { value: 'Islamisch', label: '☪️ Islamisch' },
  { value: 'Hinduistisch', label: '🕉 Hinduistisch' },
  { value: 'Buddhistisch', label: '☸️ Buddhistisch' },
  { value: 'Jüdisch', label: '✡️ Jüdisch' },
  { value: 'Andere', label: '🌍 Andere' },
  { value: 'Keine', label: '⚪ Keine' },
]

export default function FilterModal({ visible, filters, onChange, onClose }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })

  const activeCount = [
    filters.gender !== 'all',
    filters.religion !== 'all',
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

          {/* Age wheels */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎂 Alter</Text>
            <View style={styles.ageWheelRow}>
              <View style={styles.ageWheelBox}>
                <Text style={styles.ageWheelLabel}>Von</Text>
                <NumberWheelPicker
                  value={filters.ageMin}
                  min={18}
                  max={80}
                  onChange={v => set({ ageMin: Math.min(v, filters.ageMax) })}
                />
              </View>
              <Text style={styles.ageDash}>–</Text>
              <View style={styles.ageWheelBox}>
                <Text style={styles.ageWheelLabel}>Bis</Text>
                <NumberWheelPicker
                  value={filters.ageMax}
                  min={18}
                  max={80}
                  onChange={v => set({ ageMax: Math.max(v, filters.ageMin) })}
                />
              </View>
            </View>
            <Text style={styles.ageDisplay}>{filters.ageMin} – {filters.ageMax} Jahre</Text>
          </View>

          {/* Gender */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Geschlecht</Text>
            <View style={styles.chipRow}>
              {[
                { value: 'all', label: '🌍 Alle' },
                { value: 'female', label: '👩 Frauen' },
                { value: 'male', label: '👨 Männer' },
              ].map(g => (
                <Pressable key={g.value}
                  style={[styles.filterChip, filters.gender === g.value && styles.filterChipActive]}
                  onPress={() => set({ gender: g.value as Filters['gender'] })}>
                  {filters.gender === g.value
                    ? <LinearGradient colors={gradients.brandH} style={styles.chipGrad}>
                        <Text style={styles.filterChipTextActive}>{g.label}</Text>
                      </LinearGradient>
                    : <Text style={styles.filterChipText}>{g.label}</Text>
                  }
                </Pressable>
              ))}
            </View>
          </View>

          {/* Religion */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🕊 Religion</Text>
            <View style={styles.wrapChips}>
              {RELIGION_OPTIONS.map(r => (
                <Pressable key={r.value}
                  style={[styles.wrapChip, filters.religion === r.value && styles.wrapChipActive]}
                  onPress={() => set({ religion: r.value })}>
                  <Text style={[styles.wrapChipText, filters.religion === r.value && styles.wrapChipTextActive]}>
                    {r.label}
                  </Text>
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
            <View style={styles.wrapChips}>
              {POPULAR_DESTINATIONS.map(d => (
                <Pressable key={d}
                  style={[styles.wrapChip, filters.destination === d && styles.wrapChipActive]}
                  onPress={() => set({ destination: filters.destination === d ? '' : d })}>
                  <Text style={[styles.wrapChipText, filters.destination === d && styles.wrapChipTextActive]}>{d}</Text>
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
            <View style={styles.wrapChips}>
              {COUNTRIES.map(c => (
                <Pressable key={c}
                  style={[styles.wrapChip, filters.origin === c && styles.wrapChipActive]}
                  onPress={() => set({ origin: filters.origin === c ? '' : c })}>
                  <Text style={[styles.wrapChipText, filters.origin === c && styles.wrapChipTextActive]}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

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
  ageWheelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  ageWheelBox: { alignItems: 'center', gap: 8 },
  ageWheelLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  ageDash: { fontSize: 24, color: colors.textMuted, marginTop: 20 },
  ageDisplay: { textAlign: 'center', color: colors.primary, fontWeight: '800', fontSize: 15, marginTop: 12 },
  chipRow: { flexDirection: 'row', gap: 10 },
  filterChip: { flex: 1, borderRadius: 50, overflow: 'hidden',
    backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { borderColor: 'transparent' },
  chipGrad: { paddingVertical: 12, alignItems: 'center' },
  filterChipText: { color: colors.textMuted, fontWeight: '700', fontSize: 13,
    textAlign: 'center', paddingVertical: 12 },
  filterChipTextActive: { color: '#fff', fontWeight: '800', fontSize: 13 },
  wrapChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wrapChip: { backgroundColor: colors.surfaceLight, borderRadius: 50,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  wrapChipActive: { borderColor: colors.primary, backgroundColor: 'rgba(255,140,0,0.15)' },
  wrapChipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  wrapChipTextActive: { color: colors.primary },
  input: { backgroundColor: colors.surfaceLight, borderRadius: 14, padding: 14,
    color: colors.text, fontSize: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  applyBtn: { margin: spacing.lg, borderRadius: 50, overflow: 'hidden' },
  applyGrad: { padding: 18, alignItems: 'center' },
  applyText: { color: '#fff', fontWeight: '900', fontSize: 17 },
})
