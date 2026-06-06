import ChatBubble from '@/src/components/ChatBubble'
import { supabase } from '@/src/lib/supabase'
import SceneBackground from '@/src/components/SceneBackground'
import WheelDatePicker from '@/src/components/WheelDatePicker'
import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { useGroup } from '@/src/hooks/useGroup'
import { useGroupActivities } from '@/src/hooks/useGroupActivities'
import { useGroupChecklist } from '@/src/hooks/useGroupChecklist'
import { useGroupExpenses } from '@/src/hooks/useGroupExpenses'
import { useGroupMessages } from '@/src/hooks/useGroupMessages'
import { useGroupPolls } from '@/src/hooks/useGroupPolls'
import { useMatches } from '@/src/hooks/useMatches'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import {
  ActionSheetIOS, Alert, FlatList, KeyboardAvoidingView, Modal,
  Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native'

type Tab = 'chat' | 'plan' | 'liste' | 'kosten' | 'abstimmung' | 'mitglieder'

const TABS: { key: Tab; label: string }[] = [
  { key: 'chat', label: '💬 Chat' },
  { key: 'plan', label: '🗺 Plan' },
  { key: 'liste', label: '✅ Liste' },
  { key: 'kosten', label: '💰 Kosten' },
  { key: 'abstimmung', label: '🗳 Abstimmung' },
  { key: 'mitglieder', label: '👥 Mitglieder' },
]

const PACKING_TEMPLATES: Record<string, string[]> = {
  '🏖 Strand': ['Sonnencreme', 'Badehose/Bikini', 'Sonnenbrille', 'Handtuch', 'Flip-Flops', 'Schnorchelset', 'Wasserabweisende Tasche'],
  '🏔 Berge': ['Wanderschuhe', 'Regenjacke', 'Fleece-Pullover', 'Wanderstöcke', 'Erste-Hilfe-Set', 'Taschenlampe', 'Powerbank'],
  '🏙 City': ['Bequeme Schuhe', 'Stadtplan/App', 'Kreditkarte', 'Reiseführer', 'Rucksack', 'Regenschirm'],
  '🎒 Backpacker': ['Schlafsack', 'Reisehandtuch', 'Wasserfilter', 'Hängematte', 'Universalstecker', 'Kopfkissen aufblasbar'],
}

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>()
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const { group, loading, myRole, canEdit, updatePlan, updateMemberRole, removeMember, inviteMember } = useGroup(groupId, userId)
  const { messages, sendMessage } = useGroupMessages(groupId, userId)
  const { activities, addActivity, deleteActivity } = useGroupActivities(groupId, userId)
  const { items: checklist, addItem, addTemplate, toggleItem, deleteItem, doneCount } = useGroupChecklist(groupId, userId)
  const { expenses, addExpense, deleteExpense, total, myPaid, perPerson, myBalance } = useGroupExpenses(groupId, userId, group?.members?.length ?? 1)
  const { polls, createPoll, vote, deletePoll } = useGroupPolls(groupId, userId)
  const { matches } = useMatches(userId)
  const router = useRouter()
  const listRef = useRef<FlatList>(null)

  const [tab, setTab] = useState<Tab>('chat')
  const [input, setInput] = useState('')
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [settingsMaxMembers, setSettingsMaxMembers] = useState<number | null>(group?.max_members ?? null)
  const [settingsGender, setSettingsGender] = useState<'all' | 'male' | 'female'>(group?.allowed_gender ?? 'all')

  // Plan
  const [editingPlan, setEditingPlan] = useState(false)
  const [editDest, setEditDest] = useState('')
  const [editFrom, setEditFrom] = useState('')
  const [editTo, setEditTo] = useState('')
  const [editNotes, setEditNotes] = useState('')

  // Aktivitäten
  const [actTitle, setActTitle] = useState('')
  const [actDate, setActDate] = useState('')
  const [actLoc, setActLoc] = useState('')

  // Checkliste
  const [checkInput, setCheckInput] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)

  // Kosten
  const [expTitle, setExpTitle] = useState('')
  const [expAmount, setExpAmount] = useState('')

  // Abstimmung
  const [pollQ, setPollQ] = useState('')
  const [pollOpts, setPollOpts] = useState(['', ''])
  const [creatingPoll, setCreatingPoll] = useState(false)

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
    try { await sendMessage(text) } catch (e: any) {
      setInput(text)
      Alert.alert('Fehler', e.message ?? 'Nachricht nicht gesendet.')
    }
  }

  const handleSavePlan = async () => {
    try {
      await updatePlan({ destination: editDest || null, date_from: editFrom || null, date_to: editTo || null, notes: editNotes || null } as any)
      setEditingPlan(false)
    } catch { Alert.alert('Fehler', 'Plan konnte nicht gespeichert werden.') }
  }

  const handleAddActivity = async () => {
    if (!actTitle.trim()) return
    try { await addActivity(actTitle.trim(), actDate || null, actLoc || null); setActTitle(''); setActDate(''); setActLoc('') }
    catch { Alert.alert('Fehler', 'Aktivität nicht gespeichert.') }
  }

  const handleAddExpense = async () => {
    const amt = parseFloat(expAmount.replace(',', '.'))
    if (!expTitle.trim() || isNaN(amt) || amt <= 0) { Alert.alert('Fehler', 'Titel und gültigen Betrag eingeben.'); return }
    try { await addExpense(expTitle.trim(), amt); setExpTitle(''); setExpAmount('') }
    catch { Alert.alert('Fehler', 'Ausgabe nicht gespeichert.') }
  }

  const handleCreatePoll = async () => {
    const opts = pollOpts.filter(o => o.trim())
    if (!pollQ.trim() || opts.length < 2) { Alert.alert('Fehler', 'Frage und mind. 2 Optionen eingeben.'); return }
    try { await createPoll(pollQ.trim(), opts); setPollQ(''); setPollOpts(['', '']); setCreatingPoll(false) }
    catch { Alert.alert('Fehler', 'Abstimmung nicht gespeichert.') }
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
    }
  }

  const saveSettings = async () => {
    try {
      const { error } = await supabase.from('groups').update({
        max_members: settingsMaxMembers,
        allowed_gender: settingsGender,
      }).eq('id', groupId)
      if (error) throw error
      setSettingsVisible(false)
      Alert.alert('✓ Gespeichert')
    } catch { Alert.alert('Fehler', 'Einstellungen konnten nicht gespeichert werden.') }
  }

  const uninvited = matches.filter(m => !group.members.some(mem => mem.user_id === m.other_user.id))

  return (
    <SceneBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Header */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{group.name}</Text>
          {myRole === 'admin'
            ? <Pressable onPress={() => { setSettingsMaxMembers(group?.max_members ?? null); setSettingsGender(group?.allowed_gender ?? 'all'); setSettingsVisible(true) }} style={styles.settingsBtn}>
                <Text style={styles.settingsIcon}>⚙</Text>
              </Pressable>
            : <View style={{ width: 32 }} />}
        </View>

        {/* Scrollable Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
          {TABS.map(t => (
            <Pressable key={t.key} style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]} onPress={() => setTab(t.key)}>
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
              {t.key === 'liste' && checklist.length > 0 && (
                <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{doneCount}/{checklist.length}</Text></View>
              )}
            </Pressable>
          ))}
        </ScrollView>

        {/* ── CHAT ── */}
        {tab === 'chat' && (
          <>
            <FlatList ref={listRef} data={messages} keyExtractor={m => m.id}
              contentContainerStyle={styles.msgList}
              renderItem={({ item }) => <ChatBubble content={item.content} isOwn={item.sender_id === userId} createdAt={item.created_at} />}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
              ListEmptyComponent={<View style={styles.emptyTab}><Text style={styles.emptyTabText}>Noch keine Nachrichten — fang an! 👋</Text></View>}
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
          <ScrollView contentContainerStyle={styles.tabContent}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>🗺 Reiseplan</Text>
                {canEdit && !editingPlan && (
                  <Pressable onPress={() => { setEditDest(group.destination ?? ''); setEditFrom(group.date_from ?? ''); setEditTo(group.date_to ?? ''); setEditNotes((group as any).notes ?? ''); setEditingPlan(true) }}>
                    <Text style={styles.editBtn}>✏️ Bearbeiten</Text>
                  </Pressable>
                )}
              </View>
              {editingPlan ? (
                <>
                  <TextInput style={styles.planInput} value={editDest} onChangeText={setEditDest} placeholder="Reiseziel" placeholderTextColor="#aaa" />
                  <Text style={styles.dateLabel}>Von</Text>
                  <WheelDatePicker value={editFrom || null} onChange={setEditFrom} />
                  <Text style={[styles.dateLabel, { marginTop: 10 }]}>Bis</Text>
                  <WheelDatePicker value={editTo || null} onChange={setEditTo} />
                  <View style={[styles.planBtnRow, { marginTop: 12 }]}>
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

            {/* Wichtige Infos */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📋 Wichtige Infos</Text>
              {editingPlan ? (
                <TextInput style={[styles.planInput, { minHeight: 80, textAlignVertical: 'top', marginTop: 8 }]}
                  value={editNotes} onChangeText={setEditNotes}
                  placeholder="Flugdetails, Hotel, Notfallkontakte…" placeholderTextColor="#aaa" multiline />
              ) : (
                <Text style={styles.planInfo}>{(group as any).notes || 'Noch keine Infos eingetragen.'}</Text>
              )}
            </View>

            {/* Aktivitäten */}
            <Text style={styles.sectionLbl}>Aktivitäten</Text>
            {activities.map(act => (
              <View key={act.id} style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actTitle}>📌 {act.title}</Text>
                    {act.date && <Text style={styles.actMeta}>🗓 {act.date}</Text>}
                    {act.location && <Text style={styles.actMeta}>📍 {act.location}</Text>}
                  </View>
                  {(canEdit || act.created_by === userId) && (
                    <Pressable onPress={() => deleteActivity(act.id)}><Text style={{ fontSize: 18 }}>🗑</Text></Pressable>
                  )}
                </View>
              </View>
            ))}

            <View style={[styles.card, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
              <Text style={styles.sectionLbl}>+ Aktivität vorschlagen</Text>
              <TextInput style={styles.planInput} value={actTitle} onChangeText={setActTitle} placeholder="Titel *" placeholderTextColor="#aaa" />
              <Text style={[styles.dateLabel, { marginTop: 8 }]}>Datum</Text>
              <WheelDatePicker value={actDate || null} onChange={setActDate} />
              <TextInput style={[styles.planInput, { marginTop: 10 }]} value={actLoc} onChangeText={setActLoc} placeholder="Ort" placeholderTextColor="#aaa" />
              <Pressable style={[styles.saveBtn, { marginTop: 10 }]} onPress={handleAddActivity}><Text style={styles.saveBtnText}>Hinzufügen</Text></Pressable>
            </View>
          </ScrollView>
        )}

        {/* ── CHECKLISTE ── */}
        {tab === 'liste' && (
          <ScrollView contentContainerStyle={styles.tabContent}>
            {/* Progress */}
            {checklist.length > 0 && (
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={styles.cardTitle}>Fortschritt</Text>
                  <Text style={styles.cardTitle}>{doneCount}/{checklist.length}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${checklist.length > 0 ? (doneCount / checklist.length) * 100 : 0}%` }]} />
                </View>
              </View>
            )}

            {/* Items */}
            {checklist.map(item => (
              <Pressable key={item.id} style={styles.checkRow} onPress={() => toggleItem(item.id, item.is_done)}>
                <View style={[styles.checkBox, item.is_done && styles.checkBoxDone]}>
                  {item.is_done && <Text style={{ fontSize: 14, color: '#fff' }}>✓</Text>}
                </View>
                <Text style={[styles.checkText, item.is_done && styles.checkTextDone]}>{item.title}</Text>
                <Pressable onPress={() => deleteItem(item.id)}><Text style={{ fontSize: 16, opacity: 0.4 }}>✕</Text></Pressable>
              </Pressable>
            ))}

            {/* Neuer Eintrag */}
            <View style={styles.card}>
              <Text style={styles.sectionLbl}>+ Eintrag hinzufügen</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={[styles.planInput, { flex: 1 }]} value={checkInput} onChangeText={setCheckInput}
                  placeholder="Was nicht vergessen?" placeholderTextColor="#aaa"
                  returnKeyType="done" onSubmitEditing={async () => { if (checkInput.trim()) { await addItem(checkInput.trim()); setCheckInput('') } }} />
                <Pressable style={styles.saveBtn} onPress={async () => { if (checkInput.trim()) { await addItem(checkInput.trim()); setCheckInput('') } }}>
                  <Text style={styles.saveBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* Vorlagen */}
            <Pressable style={styles.templateToggle} onPress={() => setShowTemplates(v => !v)}>
              <Text style={styles.templateToggleText}>🎒 Packlistenvorlagen {showTemplates ? '▲' : '▼'}</Text>
            </Pressable>
            {showTemplates && Object.entries(PACKING_TEMPLATES).map(([name, items]) => (
              <Pressable key={name} style={styles.templateCard} onPress={async () => { await addTemplate(items); setShowTemplates(false) }}>
                <Text style={styles.templateName}>{name}</Text>
                <Text style={styles.templateItems}>{items.slice(0, 3).join(', ')}…</Text>
                <Text style={styles.templateAdd}>Hinzufügen →</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* ── KOSTEN ── */}
        {tab === 'kosten' && (
          <ScrollView contentContainerStyle={styles.tabContent}>
            {/* Balance Card */}
            <LinearGradient colors={myBalance >= 0 ? ['#1a7a4a', '#27ae60'] : ['#8b1a1a', '#e74c3c']} style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Deine Bilanz</Text>
              <Text style={styles.balanceAmount}>{myBalance >= 0 ? '+' : ''}{myBalance.toFixed(2)} €</Text>
              <Text style={styles.balanceSub}>{myBalance >= 0 ? 'Andere schulden dir Geld' : 'Du schuldest noch Geld'}</Text>
              <View style={styles.balanceRow}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.balanceMini}>Gesamt</Text>
                  <Text style={styles.balanceMiniVal}>{total.toFixed(2)} €</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.balanceMini}>Pro Person</Text>
                  <Text style={styles.balanceMiniVal}>{perPerson.toFixed(2)} €</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.balanceMini}>Du bezahlt</Text>
                  <Text style={styles.balanceMiniVal}>{myPaid.toFixed(2)} €</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Neue Ausgabe */}
            <View style={styles.card}>
              <Text style={styles.sectionLbl}>+ Ausgabe hinzufügen</Text>
              <TextInput style={styles.planInput} value={expTitle} onChangeText={setExpTitle} placeholder="Was wurde bezahlt?" placeholderTextColor="#aaa" />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TextInput style={[styles.planInput, { flex: 1 }]} value={expAmount} onChangeText={setExpAmount}
                  placeholder="0.00 €" placeholderTextColor="#aaa" keyboardType="decimal-pad" />
                <Pressable style={styles.saveBtn} onPress={handleAddExpense}><Text style={styles.saveBtnText}>Hinzufügen</Text></Pressable>
              </View>
            </View>

            {/* Liste */}
            {expenses.length === 0 ? (
              <View style={styles.emptyTab}><Text style={styles.emptyTabText}>Noch keine Ausgaben erfasst 💸</Text></View>
            ) : expenses.map(exp => (
              <View key={exp.id} style={styles.expenseRow}>
                <View style={styles.expenseIcon}><Text style={{ fontSize: 20 }}>💳</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.expenseTitle}>{exp.title}</Text>
                  <Text style={styles.expenseMeta}>{exp.paid_by === userId ? '👤 Du' : '👤 Jemand'} · {new Date(exp.created_at).toLocaleDateString('de-DE')}</Text>
                </View>
                <Text style={styles.expenseAmount}>{Number(exp.amount).toFixed(2)} €</Text>
                {exp.paid_by === userId && <Pressable onPress={() => deleteExpense(exp.id)}><Text style={{ fontSize: 16, opacity: 0.5, marginLeft: 8 }}>🗑</Text></Pressable>}
              </View>
            ))}
          </ScrollView>
        )}

        {/* ── ABSTIMMUNG ── */}
        {tab === 'abstimmung' && (
          <ScrollView contentContainerStyle={styles.tabContent}>
            {!creatingPoll ? (
              <Pressable style={styles.newPollBtn} onPress={() => setCreatingPoll(true)}>
                <LinearGradient colors={gradients.brand} style={styles.newPollBtnGrad}>
                  <Text style={styles.newPollBtnText}>+ Neue Abstimmung erstellen</Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>🗳 Neue Abstimmung</Text>
                <TextInput style={[styles.planInput, { marginTop: 8 }]} value={pollQ} onChangeText={setPollQ} placeholder="Frage stellen…" placeholderTextColor="#aaa" />
                <Text style={[styles.sectionLbl, { marginTop: 12 }]}>Optionen</Text>
                {pollOpts.map((opt, i) => (
                  <TextInput key={i} style={[styles.planInput, { marginBottom: 8 }]} value={opt}
                    onChangeText={v => { const n = [...pollOpts]; n[i] = v; setPollOpts(n) }}
                    placeholder={`Option ${i + 1}`} placeholderTextColor="#aaa" />
                ))}
                {pollOpts.length < 5 && (
                  <Pressable onPress={() => setPollOpts(p => [...p, ''])}><Text style={styles.editBtn}>+ Option hinzufügen</Text></Pressable>
                )}
                <View style={styles.planBtnRow}>
                  <Pressable style={styles.saveBtn} onPress={handleCreatePoll}><Text style={styles.saveBtnText}>Erstellen</Text></Pressable>
                  <Pressable onPress={() => setCreatingPoll(false)}><Text style={styles.cancelBtn}>Abbrechen</Text></Pressable>
                </View>
              </View>
            )}

            {polls.length === 0 && !creatingPoll && (
              <View style={styles.emptyTab}><Text style={styles.emptyTabText}>Noch keine Abstimmungen 🗳</Text></View>
            )}

            {polls.map(poll => {
              const totalVotes = poll.options.reduce((s, o) => s + o.voter_ids.length, 0)
              const myVote = poll.options.find(o => o.voter_ids.includes(userId))
              return (
                <View key={poll.id} style={styles.card}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Text style={[styles.cardTitle, { flex: 1 }]}>{poll.question}</Text>
                    {poll.created_by === userId && <Pressable onPress={() => deletePoll(poll.id)}><Text style={{ fontSize: 16, opacity: 0.4 }}>🗑</Text></Pressable>}
                  </View>
                  <Text style={styles.actMeta}>{totalVotes} Stimme{totalVotes !== 1 ? 'n' : ''}</Text>
                  {poll.options.map(opt => {
                    const pct = totalVotes > 0 ? (opt.voter_ids.length / totalVotes) * 100 : 0
                    const isMyVote = opt.id === myVote?.id
                    return (
                      <Pressable key={opt.id} style={[styles.pollOption, isMyVote && styles.pollOptionActive]} onPress={() => vote(poll.id, opt.id)}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={styles.pollOptionText}>{isMyVote ? '✓ ' : ''}{opt.text}</Text>
                          <Text style={styles.pollOptionPct}>{Math.round(pct)}%</Text>
                        </View>
                        <View style={styles.pollBar}>
                          <View style={[styles.pollBarFill, { width: `${pct}%` }, isMyVote && { backgroundColor: colors.primary }]} />
                        </View>
                      </Pressable>
                    )
                  })}
                </View>
              )
            })}
          </ScrollView>
        )}

        {/* ── MITGLIEDER ── */}
        {tab === 'mitglieder' && (
          <ScrollView contentContainerStyle={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>👥 {group.members.length} Mitglieder</Text>
            </View>
            {group.members.map(mem => (
              <Pressable key={mem.user_id} style={styles.memberRow}
                onPress={() => handleMemberAction(mem.user_id)}
                disabled={mem.user_id === userId || myRole !== 'admin'}>
                <View style={styles.memberAvatar}><Text style={{ fontSize: 22 }}>👤</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{mem.profile?.name ?? 'Unbekannt'}</Text>
                  <Text style={styles.memberMeta}>
                    {mem.role === 'admin' ? '⭐ Admin' : mem.role === 'moderator' ? '🔧 Moderator' : '👤 Mitglied'}
                    {mem.status === 'invited' ? ' · Ausstehend' : ''}
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
                    onPress={() => inviteMember(m.other_user.id).then(() => Alert.alert('✓', 'Einladung gesendet!'))}>
                    <Text style={styles.memberName}>{m.other_user.name}, {m.other_user.age}</Text>
                    <Text style={styles.inviteAction}>Einladen →</Text>
                  </Pressable>
                ))}
              </>
            )}
          </ScrollView>
        )}

      </KeyboardAvoidingView>

      {/* Settings Modal */}
      <Modal visible={settingsVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSettingsVisible(false)}>
        <View style={styles.settingsRoot}>
          <View style={styles.settingsHandle} />
          <Text style={styles.settingsTitle}>⚙ Gruppeneinstellungen</Text>

          <Text style={styles.settingsLabel}>Max. Mitglieder</Text>
          <View style={styles.chipRow}>
            {([null, 5, 10, 20, 50] as const).map(n => (
              <Pressable key={String(n)} style={[styles.chip, settingsMaxMembers === n && styles.chipActive]} onPress={() => setSettingsMaxMembers(n)}>
                <Text style={[styles.chipText, settingsMaxMembers === n && styles.chipTextActive]}>
                  {n === null ? '∞ Unbegrenzt' : `${n} Personen`}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.settingsLabel}>Erlaubtes Geschlecht</Text>
          <View style={styles.chipRow}>
            {([['all', '👥 Alle'], ['male', '♂ Männlich'], ['female', '♀ Weiblich']] as const).map(([val, label]) => (
              <Pressable key={val} style={[styles.chip, settingsGender === val && styles.chipActive]} onPress={() => setSettingsGender(val)}>
                <Text style={[styles.chipText, settingsGender === val && styles.chipTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Current values info */}
          <View style={styles.settingsInfo}>
            <Text style={styles.settingsInfoText}>
              Aktuell: {settingsMaxMembers ? `Max. ${settingsMaxMembers} Mitglieder` : 'Unbegrenzt'} · {settingsGender === 'all' ? 'Alle' : settingsGender === 'male' ? 'Nur Männer' : 'Nur Frauen'}
            </Text>
          </View>

          <Pressable style={styles.saveBtn} onPress={saveSettings}>
            <Text style={styles.saveBtnText}>Speichern</Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={() => setSettingsVisible(false)}>
            <Text style={styles.cancelBtnText}>Abbrechen</Text>
          </Pressable>
        </View>
      </Modal>

    </SceneBackground>
  )
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: 12,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  back: { fontSize: 26, color: '#fff', width: 32 },
  settingsBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  settingsIcon: { fontSize: 20, color: 'rgba(255,255,255,0.7)' },
  settingsRoot: { flex: 1, backgroundColor: '#0d1b2e', padding: 24 },
  settingsHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(245,240,235,0.2)', alignSelf: 'center', marginBottom: 24 },
  settingsTitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 24 },
  settingsLabel: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10, marginTop: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)' },
  chipActive: { backgroundColor: 'rgba(232,132,92,0.25)', borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  chipTextActive: { color: '#fff' },
  settingsInfo: { marginTop: 24, padding: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12 },
  settingsInfoText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  saveBtn: { marginTop: 28, backgroundColor: colors.primary, borderRadius: 16, padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  cancelBtn: { marginTop: 12, padding: 16, alignItems: 'center' },
  cancelBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 15 },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff', flex: 1, textAlign: 'center' },
  tabsScroll: { flexGrow: 0, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tabsContent: { paddingHorizontal: spacing.md, paddingVertical: 8, gap: 6 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)', flexDirection: 'row', alignItems: 'center', gap: 4 },
  tabBtnActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  tabLabelActive: { color: '#fff' },
  tabBadge: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  tabBadgeText: { fontSize: 9, color: '#fff', fontWeight: '900' },
  tabContent: { padding: spacing.lg, paddingBottom: 100 },
  card: { backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: '#fff' },
  editBtn: { fontSize: 13, fontWeight: '700', color: colors.primary },
  planInfo: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  planInput: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12, padding: 12, fontSize: 14, color: '#1a1a2e', marginBottom: 4 },
  dateLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  planBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  cancelBtn: { color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 14 },
  sectionLbl: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.6)', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  actTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  actMeta: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  msgList: { padding: spacing.lg, paddingBottom: 20 },
  emptyTab: { alignItems: 'center', paddingTop: 60 },
  emptyTabText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  inputRow: { flexDirection: 'row', padding: spacing.md, gap: 10,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chatInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#1a1a2e',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendIcon: { color: '#fff', fontSize: 16 },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#27ae60', borderRadius: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  checkBox: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center', alignItems: 'center' },
  checkBoxDone: { backgroundColor: '#27ae60', borderColor: '#27ae60' },
  checkText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#fff' },
  checkTextDone: { opacity: 0.4, textDecorationLine: 'line-through' },
  templateToggle: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center' },
  templateToggleText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  templateCard: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  templateName: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 4 },
  templateItems: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
  templateAdd: { fontSize: 12, fontWeight: '700', color: colors.primary },
  balanceCard: { borderRadius: 20, padding: 20, marginBottom: 16, alignItems: 'center' },
  balanceLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '700', marginBottom: 4 },
  balanceAmount: { fontSize: 36, fontWeight: '900', color: '#fff', marginBottom: 4 },
  balanceSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
  balanceRow: { flexDirection: 'row', gap: 24 },
  balanceMini: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  balanceMiniVal: { fontSize: 14, fontWeight: '800', color: '#fff' },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  expenseIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center' },
  expenseTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  expenseMeta: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  expenseAmount: { fontSize: 16, fontWeight: '900', color: '#fff' },
  newPollBtn: { borderRadius: 50, overflow: 'hidden', marginBottom: 16 },
  newPollBtnGrad: { padding: 14, alignItems: 'center' },
  newPollBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  pollOption: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, marginTop: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  pollOptionActive: { borderColor: colors.primary, backgroundColor: 'rgba(255,140,0,0.15)' },
  pollOptionText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  pollOptionPct: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  pollBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' },
  pollBarFill: { height: '100%', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  memberAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center' },
  memberName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  memberMeta: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  moreIcon: { fontSize: 18, color: 'rgba(255,255,255,0.4)' },
  inviteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,140,0,0.1)', borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,140,0,0.3)' },
  inviteAction: { fontSize: 13, fontWeight: '700', color: colors.primary },
})
