import ChatBubble from '@/src/components/ChatBubble'
import SceneBackground from '@/src/components/SceneBackground'
import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { useGroup } from '@/src/hooks/useGroup'
import { useGroupActivities } from '@/src/hooks/useGroupActivities'
import { useGroupMessages } from '@/src/hooks/useGroupMessages'
import { useMatches } from '@/src/hooks/useMatches'
import { GroupRole } from '@/src/types'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import {
  ActionSheetIOS, Alert, FlatList, KeyboardAvoidingView,
  Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native'

type Tab = 'chat' | 'plan' | 'members'

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>()
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const { group, loading, myRole, canEdit, updatePlan, updateMemberRole, removeMember, inviteMember } = useGroup(groupId, userId)
  const { messages, sendMessage } = useGroupMessages(groupId, userId)
  const { activities, addActivity, deleteActivity } = useGroupActivities(groupId, userId)
  const { matches } = useMatches(userId)
  const router = useRouter()

  const [tab, setTab] = useState<Tab>('chat')
  const [input, setInput] = useState('')
  const [actTitle, setActTitle] = useState('')
  const [actDate, setActDate] = useState('')
  const [actLoc, setActLoc] = useState('')
  const [editDest, setEditDest] = useState('')
  const [editFrom, setEditFrom] = useState('')
  const [editTo, setEditTo] = useState('')
  const [editingPlan, setEditingPlan] = useState(false)
  const listRef = useRef<FlatList>(null)

  if (loading || !group) return (
    <SceneBackground>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 16 }}>Laden…</Text>
      </View>
    </SceneBackground>
  )

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    try {
      await sendMessage(text)
    } catch (e: any) {
      setInput(text)
      Alert.alert('Fehler', e.message ?? 'Nachricht nicht gesendet.')
    }
  }

  const handleSavePlan = async () => {
    try {
      await updatePlan({ destination: editDest || null, date_from: editFrom || null, date_to: editTo || null })
      setEditingPlan(false)
    } catch { Alert.alert('Fehler', 'Plan konnte nicht gespeichert werden.') }
  }

  const handleAddActivity = async () => {
    if (!actTitle.trim()) return
    try { await addActivity(actTitle.trim(), actDate || null, actLoc || null); setActTitle(''); setActDate(''); setActLoc('') }
    catch { Alert.alert('Fehler', 'Aktivität nicht gespeichert.') }
  }

  const handleMemberAction = (memberId: string) => {
    if (myRole !== 'admin') return
    const options = ['Moderator machen', 'Mitglied machen', 'Entfernen', 'Abbrechen']
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options, destructiveButtonIndex: 2, cancelButtonIndex: 3 }, async idx => {
        if (idx === 0) await updateMemberRole(memberId, 'moderator')
        if (idx === 1) await updateMemberRole(memberId, 'member')
        if (idx === 2) await removeMember(memberId)
      })
    } else {
      Alert.alert('Aktion', '', [
        { text: 'Moderator machen', onPress: () => updateMemberRole(memberId, 'moderator') },
        { text: 'Mitglied machen', onPress: () => updateMemberRole(memberId, 'member') },
        { text: 'Entfernen', style: 'destructive', onPress: () => removeMember(memberId) },
        { text: 'Abbrechen', style: 'cancel' },
      ])
    }
  }

  const uninvited = matches.filter(m => !group.members.some(mem => mem.user_id === m.other_user.id))

  return (
    <SceneBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{group.name}</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.tabs}>
          {(['chat','plan','members'] as Tab[]).map(t => (
            <Pressable key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {t === 'chat' ? '💬 Chat' : t === 'plan' ? '🗺 Plan' : '👥 Mitglieder'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── CHAT ── */}
        {tab === 'chat' && (
          <>
            <FlatList ref={listRef} data={messages} keyExtractor={m => m.id}
              contentContainerStyle={styles.msgList}
              renderItem={({ item }) => (
                <ChatBubble content={item.content} isOwn={item.sender_id === userId} createdAt={item.created_at} />
              )}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
              ListEmptyComponent={<View style={styles.emptyChat}><Text style={styles.emptyChatText}>Noch keine Nachrichten — fang an! 👋</Text></View>}
            />
            <View style={styles.inputRow}>
              <TextInput style={styles.chatInput} value={input} onChangeText={setInput}
                placeholder="Nachricht..." placeholderTextColor="rgba(0,0,0,0.35)"
                returnKeyType="send" onSubmitEditing={handleSend} />
              <Pressable onPress={handleSend}>
                <LinearGradient colors={gradients.brand} style={styles.sendBtn}>
                  <Text style={styles.sendIcon}>➤</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </>
        )}

        {/* ── PLAN ── */}
        {tab === 'plan' && (
          <ScrollView contentContainerStyle={styles.planContent}>
            <View style={styles.planCard}>
              <View style={styles.planCardHeader}>
                <Text style={styles.planCardTitle}>Reiseplan</Text>
                {canEdit && !editingPlan && (
                  <Pressable onPress={() => { setEditDest(group.destination ?? ''); setEditFrom(group.date_from ?? ''); setEditTo(group.date_to ?? ''); setEditingPlan(true) }}>
                    <Text style={styles.editBtn}>✏️ Bearbeiten</Text>
                  </Pressable>
                )}
              </View>
              {editingPlan ? (
                <>
                  <TextInput style={styles.planInput} value={editDest} onChangeText={setEditDest} placeholder="Reiseziel" placeholderTextColor="#aaa" />
                  <TextInput style={styles.planInput} value={editFrom} onChangeText={setEditFrom} placeholder="Von (JJJJ-MM-TT)" placeholderTextColor="#aaa" />
                  <TextInput style={styles.planInput} value={editTo} onChangeText={setEditTo} placeholder="Bis (JJJJ-MM-TT)" placeholderTextColor="#aaa" />
                  <View style={styles.planBtnRow}>
                    <Pressable style={styles.saveBtn} onPress={handleSavePlan}><Text style={styles.saveBtnText}>Speichern</Text></Pressable>
                    <Pressable onPress={() => setEditingPlan(false)}><Text style={styles.cancelBtn}>Abbrechen</Text></Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.planInfo}>{group.destination ? `📍 ${group.destination}` : '📍 Kein Ziel festgelegt'}</Text>
                  <Text style={styles.planInfo}>{group.date_from ? `🗓 ${group.date_from}${group.date_to ? ` → ${group.date_to}` : ''}` : '🗓 Kein Datum'}</Text>
                </>
              )}
            </View>

            <Text style={styles.sectionLbl}>Aktivitäten</Text>
            {activities.map(act => (
              <View key={act.id} style={styles.actCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actTitle}>{act.title}</Text>
                  {act.date && <Text style={styles.actMeta}>🗓 {act.date}</Text>}
                  {act.location && <Text style={styles.actMeta}>📍 {act.location}</Text>}
                </View>
                {(canEdit || act.created_by === userId) && (
                  <Pressable onPress={() => deleteActivity(act.id)}><Text style={{ fontSize: 18 }}>🗑</Text></Pressable>
                )}
              </View>
            ))}

            <View style={styles.addActCard}>
              <Text style={styles.sectionLbl}>+ Aktivität vorschlagen</Text>
              <TextInput style={styles.planInput} value={actTitle} onChangeText={setActTitle} placeholder="Titel *" placeholderTextColor="#aaa" />
              <TextInput style={styles.planInput} value={actDate} onChangeText={setActDate} placeholder="Datum" placeholderTextColor="#aaa" />
              <TextInput style={styles.planInput} value={actLoc} onChangeText={setActLoc} placeholder="Ort" placeholderTextColor="#aaa" />
              <Pressable style={styles.saveBtn} onPress={handleAddActivity}><Text style={styles.saveBtnText}>Hinzufügen</Text></Pressable>
            </View>
          </ScrollView>
        )}

        {/* ── MEMBERS ── */}
        {tab === 'members' && (
          <ScrollView contentContainerStyle={styles.membersContent}>
            {group.members.map(mem => (
              <Pressable key={mem.user_id} style={styles.memberRow}
                onPress={() => handleMemberAction(mem.user_id)}
                disabled={mem.user_id === userId || myRole !== 'admin'}>
                <View style={styles.memberAvatar}><Text style={{ fontSize: 22 }}>👤</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{mem.profile?.name ?? 'Unbekannt'}</Text>
                  <Text style={styles.memberMeta}>
                    {mem.role === 'admin' ? '⭐ Admin' : mem.role === 'moderator' ? '🔧 Moderator' : '👤 Mitglied'}
                    {mem.status === 'invited' ? ' · Eingeladen' : ''}
                  </Text>
                </View>
                {myRole === 'admin' && mem.user_id !== userId && <Text style={styles.moreIcon}>···</Text>}
              </Pressable>
            ))}

            {canEdit && uninvited.length > 0 && (
              <>
                <Text style={[styles.sectionLbl, { marginTop: 20 }]}>Matches einladen</Text>
                {uninvited.map(m => (
                  <Pressable key={m.id} style={styles.inviteRow}
                    onPress={() => inviteMember(m.other_user.id).then(() => Alert.alert('✓ Einladung gesendet'))}>
                    <Text style={styles.memberName}>{m.other_user.name}, {m.other_user.age}</Text>
                    <Text style={styles.inviteAction}>Einladen →</Text>
                  </Pressable>
                ))}
              </>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SceneBackground>
  )
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: 12,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  back: { fontSize: 26, color: '#fff', width: 32 },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff', flex: 1, textAlign: 'center' },
  tabs: { flexDirection: 'row', marginHorizontal: spacing.lg, marginVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 14, padding: 3 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 12 },
  tabBtnActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  tabLabelActive: { color: '#fff' },
  msgList: { padding: spacing.lg, paddingBottom: 20 },
  emptyChat: { alignItems: 'center', paddingTop: 60 },
  emptyChatText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  inputRow: { flexDirection: 'row', padding: spacing.md, gap: 10,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chatInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#1a1a2e',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendIcon: { color: '#fff', fontSize: 16 },
  planContent: { padding: spacing.lg, paddingBottom: 100 },
  planCard: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  planCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  planCardTitle: { fontSize: 16, fontWeight: '900', color: '#fff' },
  editBtn: { fontSize: 13, fontWeight: '700', color: colors.primary },
  planInfo: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  planInput: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12, padding: 12, fontSize: 14, color: '#1a1a2e', marginBottom: 8 },
  planBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  saveBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, padding: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  cancelBtn: { color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 14 },
  sectionLbl: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.6)', marginBottom: 8, letterSpacing: 0.5 },
  actCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  actTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  actMeta: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  addActCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14, marginTop: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  membersContent: { padding: spacing.lg, paddingBottom: 100 },
  memberRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  memberAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  memberName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  memberMeta: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  moreIcon: { fontSize: 18, color: 'rgba(255,255,255,0.4)' },
  inviteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,140,0,0.08)', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,140,0,0.2)' },
  inviteAction: { fontSize: 13, fontWeight: '700', color: colors.primary },
})
