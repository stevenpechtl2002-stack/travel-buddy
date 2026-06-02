import { colors } from '../constants/theme'
import { StyleSheet, Text, View } from 'react-native'

export default function PremiumBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>⭐ Pro</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { backgroundColor: colors.primary, borderRadius: 9999,
    paddingHorizontal: 8, paddingVertical: 2 },
  text: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
})
