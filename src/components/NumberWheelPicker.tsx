import { useRef, useEffect } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors } from '../constants/theme'

const ITEM_H = 40
const VISIBLE = 5
const NUMBERS = Array.from({ length: 99 }, (_, i) => i + 2) // 2..100

interface Props {
  value: number | null
  onChange: (n: number) => void
}

export default function NumberWheelPicker({ value, onChange }: Props) {
  const ref = useRef<ScrollView>(null)
  const current = value ?? 10

  useEffect(() => {
    const idx = NUMBERS.indexOf(current)
    if (idx >= 0) {
      ref.current?.scrollTo({ y: idx * ITEM_H, animated: false })
    }
  }, [])

  const onScroll = (e: any) => {
    const y = e.nativeEvent.contentOffset.y
    const idx = Math.round(y / ITEM_H)
    const clamped = Math.max(0, Math.min(idx, NUMBERS.length - 1))
    onChange(NUMBERS[clamped])
  }

  return (
    <View style={styles.root}>
      {/* Selection highlight */}
      <View style={styles.highlight} pointerEvents="none" />
      <ScrollView
        ref={ref}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={onScroll}
        contentContainerStyle={{ paddingVertical: ITEM_H * Math.floor(VISIBLE / 2) }}
      >
        {NUMBERS.map(n => {
          const isSelected = n === current
          return (
            <View key={n} style={styles.item}>
              <Text style={[styles.num, isSelected && styles.numActive]}>{n}</Text>
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    width: 72,
    height: ITEM_H * VISIBLE,
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  highlight: {
    position: 'absolute',
    top: ITEM_H * Math.floor(VISIBLE / 2),
    left: 0, right: 0,
    height: ITEM_H,
    backgroundColor: 'rgba(232,132,92,0.18)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.primary,
    zIndex: 1,
  },
  scroll: { flex: 1 },
  item: { height: ITEM_H, justifyContent: 'center', alignItems: 'center' },
  num: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.35)' },
  numActive: { fontSize: 22, fontWeight: '900', color: '#fff' },
})
