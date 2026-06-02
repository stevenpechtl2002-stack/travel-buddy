import { colors, spacing } from '../constants/theme'
import { StyleSheet, Text, View } from 'react-native'

interface Props {
  content: string
  isOwn: boolean
  createdAt: string
}

export default function ChatBubble({ content, isOwn, createdAt }: Props) {
  const time = new Date(createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  return (
    <View style={[styles.wrapper, isOwn && styles.wrapperOwn]}>
      <View style={[styles.bubble, isOwn && styles.bubbleOwn]}>
        <Text style={[styles.text, isOwn && styles.textOwn]}>{content}</Text>
      </View>
      <Text style={styles.time}>{time}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.sm, alignItems: 'flex-start', maxWidth: '80%' },
  wrapperOwn: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.sm,
    borderBottomLeftRadius: 4 },
  bubbleOwn: { backgroundColor: colors.primary, borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4 },
  text: { fontSize: 15, color: colors.text },
  textOwn: { color: '#fff' },
  time: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
})
