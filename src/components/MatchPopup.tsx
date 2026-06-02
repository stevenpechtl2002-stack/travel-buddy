import { colors, spacing } from '../constants/theme'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

interface Props {
  visible: boolean
  matchName: string
  onStartChat: () => void
  onClose: () => void
}

export default function MatchPopup({ visible, matchName, onStartChat, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <LinearGradient colors={['#f7971e', '#ffd200']} style={styles.card}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>It's a Match!</Text>
          <Text style={styles.subtitle}>Du und {matchName} reist in die gleiche Richtung!</Text>
          <Pressable style={styles.chatButton} onPress={onStartChat}>
            <Text style={styles.chatButtonText}>💬 Jetzt chatten</Text>
          </Pressable>
          <Pressable onPress={onClose}>
            <Text style={styles.skip}>Weiter swipen</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  card: { borderRadius: 20, padding: spacing.xl, alignItems: 'center', width: '100%' },
  emoji: { fontSize: 48, marginBottom: spacing.md },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: spacing.sm },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center',
    marginBottom: spacing.xl },
  chatButton: { backgroundColor: '#fff', borderRadius: 12, padding: spacing.md,
    alignItems: 'center', width: '100%', marginBottom: spacing.md },
  chatButtonText: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
  skip: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
})
