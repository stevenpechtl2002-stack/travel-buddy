import ChatBubble from '@/src/components/ChatBubble'
import { colors, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { useChat } from '@/src/hooks/useChat'
import { useMatches } from '@/src/hooks/useMatches'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>()
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const { messages, sendMessage, error } = useChat(matchId, userId)
  const { matches } = useMatches(userId)
  const [input, setInput] = useState('')
  const listRef = useRef<FlatList>(null)
  const router = useRouter()

  const match = matches.find(m => m.id === matchId)
  const partnerName = match?.other_user.name ?? 'Chat'

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    try {
      await sendMessage(text)
    } catch {
      Alert.alert('Fehler', 'Nachricht konnte nicht gesendet werden.')
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Zurück" accessibilityRole="button">
          <Text style={styles.back}>‹ Zurück</Text>
        </Pressable>
        <Text style={styles.title}>{partnerName}</Text>
        <View style={{ width: 60 }} />
      </View>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Fehler beim Laden der Nachrichten</Text>
        </View>
      )}
      <FlatList ref={listRef} data={messages} keyExtractor={m => m.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => (
          <ChatBubble content={item.content} isOwn={item.sender_id === userId}
            createdAt={item.created_at} />
        )}
        onContentSizeChange={() => listRef.current?.scrollToEnd()}
      />
      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={input} onChangeText={setInput}
          placeholder="Nachricht..." returnKeyType="send" onSubmitEditing={handleSend}
          accessibilityLabel="Nachricht eingeben" />
        <Pressable style={styles.sendBtn} onPress={handleSend}
          accessibilityLabel="Nachricht senden" accessibilityRole="button">
          <Text style={styles.sendIcon}>➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, borderBottomWidth: 1, borderColor: colors.border,
    paddingTop: spacing.xl },
  back: { fontSize: 18, color: colors.primary, width: 60 },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  messageList: { padding: spacing.md, paddingBottom: spacing.xl },
  errorBanner: { backgroundColor: '#ffe0e0', padding: spacing.sm },
  errorText: { color: colors.error, fontSize: 13, textAlign: 'center' },
  inputRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm,
    borderTopWidth: 1, borderColor: colors.border },
  input: { flex: 1, backgroundColor: colors.surface, borderRadius: 24,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 15 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center' },
  sendIcon: { color: '#fff', fontSize: 16 },
})
