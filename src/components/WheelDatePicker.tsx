import { useRef, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'

const ITEM_H = 44
const VISIBLE = 5

interface Props {
  label: string
  value: number
  items: number[]
  onChange: (v: number) => void
  format?: (v: number) => string
}

function WheelColumn({ label, value, items, onChange, format }: Props) {
  const ref = useRef<ScrollView>(null)
  const idx = items.indexOf(value)

  useEffect(() => {
    const i = items.indexOf(value)
    if (i >= 0) ref.current?.scrollTo({ y: i * ITEM_H, animated: false })
  }, [])

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H)
    const clamped = Math.max(0, Math.min(i, items.length - 1))
    onChange(items[clamped])
  }

  return (
    <View style={col.wrap}>
      <Text style={col.label}>{label}</Text>
      <View style={col.drum}>
        <View style={col.selector} pointerEvents="none" />
        <ScrollView
          ref={ref}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          onMomentumScrollEnd={onMomentumEnd}
          contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        >
          {items.map(v => (
            <View key={v} style={col.item}>
              <Text style={[col.itemText, v === value && col.itemTextActive]}>
                {format ? format(v) : String(v).padStart(2, '0')}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

function parseDate(s: string | null): { d: number; m: number; y: number } {
  if (!s) {
    const now = new Date()
    return { d: now.getDate(), m: now.getMonth() + 1, y: now.getFullYear() }
  }
  const parts = s.split('-')
  return { y: parseInt(parts[0]) || 2025, m: parseInt(parts[1]) || 1, d: parseInt(parts[2]) || 1 }
}

function daysInMonth(m: number, y: number) {
  return new Date(y, m, 0).getDate()
}

interface DatePickerProps {
  value: string | null
  onChange: (iso: string) => void
}

export default function WheelDatePicker({ value, onChange }: DatePickerProps) {
  const { d, m, y } = parseDate(value)
  const days = Array.from({ length: daysInMonth(m, y) }, (_, i) => i + 1)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years = Array.from({ length: 10 }, (_, i) => 2025 + i)

  const emit = (nd: number, nm: number, ny: number) => {
    const safeD = Math.min(nd, daysInMonth(nm, ny))
    onChange(`${ny}-${String(nm).padStart(2, '0')}-${String(safeD).padStart(2, '0')}`)
  }

  return (
    <View style={styles.row}>
      <WheelColumn label="Tag" value={d} items={days} onChange={nd => emit(nd, m, y)} />
      <WheelColumn label="Monat" value={m} items={months} onChange={nm => emit(d, nm, y)} format={v => MONTHS[v - 1]} />
      <WheelColumn label="Jahr" value={y} items={years} onChange={ny => emit(d, m, ny)} format={v => String(v)} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 8 },
})

const col = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center' },
  label: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: 4, letterSpacing: 0.5 },
  drum: { height: ITEM_H * VISIBLE, overflow: 'hidden', width: '100%', borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  selector: { position: 'absolute', top: ITEM_H * 2, left: 0, right: 0, height: ITEM_H,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, zIndex: 1 },
  item: { height: ITEM_H, justifyContent: 'center', alignItems: 'center' },
  itemText: { fontSize: 16, color: 'rgba(255,255,255,0.45)', fontWeight: '500' },
  itemTextActive: { color: '#fff', fontWeight: '800', fontSize: 18 },
})
