import SceneBackground from '@/src/components/SceneBackground'
import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { useMatches } from '@/src/hooks/useMatches'
import { supabase } from '@/src/lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native'

export default function CreateGroupScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const { matches } = useMatches(userId)
  const router = useRouter()
  const { preselectedMatchId } = useLocalSearchParams<{ preselectedMatchId?: string }>()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [destination, setDestination] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>(preselectedMatchId ? [preselectedMatchId] : [])
  const [loading, setLoading] = useState(false)

  const toggleMatch = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert('Fehler', 'Bitte gib einen Gruppennamen ein.'); return }
    setLoading(true)
    try {
      const { data: group, error } = await supabase.from('groups').insert({
        name: name.trim(), description: description.trim() || null,
        destination: destination.trim() || null,
        date_from: dateFrom.trim() || null, date_to: dateTo.trim() || null,
        is_public: isPublic, created_by: userId,
      }).select().single()

      if (error || !group) throw new Error(error?.message ?? 'Fehler')

      await supabase.from('group_members').insert({ group_id: group.id, user_id: userId, role: 'admin', status: 'active', joined_at: new Date().toISOString() })

      for (const id of selectedIds) {
        await supabase.from('group_members').insert({ group_id: group.id, user_id: id, role: 'member', status: 'invited' })
      }

      router.replace(`/group/${group.id}`)
    } catch (e: any) {
      Alert.alert('Fehler', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SceneBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Zurück</Text></Pressable>
          <Text style={styles.title}>Neue Gruppe</Text>
          <View style={{ width: 70 }} />
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Gruppenname *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="z.B. Bali Squad 2025" placeholderTextColor="#aaa" />

          <Text style={styles.label}>Beschreibung</Text>
          <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription} placeholder="Was plant ihr?" placeholderTextColor="#aaa" multiline numberOfLines={3} />

          <Text style={styles.label}>Reiseziel</Text>
          <TextInput style={styles.input} value={destination} onChangeText={setDestination} placeholder="z.B. Bali, Indonesien" placeholderTextColor="#aaa" />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Von</Text>
              <TextInput style={styles.input} value={dateFrom} onChangeText={setDateFrom} placeholder="2025-07-01" placeholderTextColor="#aaa" />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Bis</Text>
              <TextInput style={styles.input} value={dateTo} onChangeText={setDateTo} placeholder="2025-07-14" placeholderTextColor="#aaa" />
            </View>
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>Öffentliche Gruppe</Text>
              <Text style={styles.switchSub}>Andere können beitreten</Text>
            </View>
            <Switch value={isPublic} onValueChange={setIsPublic}
              trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.15)' }} thumbColor="#fff" />
          </View>

          {matches.length > 0 && (
            <>
              <Text style={styles.label}>Matches einladen</Text>
              {matches.map(match => {
                const sel = selectedIds.includes(match.other_user.id)
                return (
                  <Pressable key={match.id} style={[styles.matchRow, sel && styles.matchRowSel]}
                    onPress={() => toggleMatch(match.other_user.id)}>
                    <Text style={styles.matchName}>{match.other_user.name}, {match.other_user.age}</Text>
                    <Text style={{ fontSize: 18 }}>{sel ? '✅' : '⬜'}</Text>
                  </Pressable>
                )
              })}
            </>
          )}

          <Pressable style={[styles.createBtn, loading && { opacity: 0.6 }]} onPress={handleCreate} disabled={loading}>
            <LinearGradient colors={gradients.brand} style={styles.createBtnGrad}>
              <Text style={styles.createBtnText}>{loading ? 'Erstellen...' : 'Gruppe erstellen ✓'}</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SceneBackground>
  )
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: 14,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  back: { fontSize: 16, color: '#fff', fontWeight: '700', width: 70 },
  title: { fontSize: 18, fontWeight: '900', color: '#fff' },
  form: { padding: spacing.lg, paddingBottom: 100 },
  label: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.7)', marginBottom: 6, marginTop: 14, letterSpacing: 0.5 },
  switchSub: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  input: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 14, padding: 13, fontSize: 15, color: '#1a1a2e' },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14 },
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 14, padding: 13, marginBottom: 8 },
  matchRowSel: { borderWidth: 2, borderColor: colors.primary },
  matchName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  createBtn: { marginTop: 24, borderRadius: 50, overflow: 'hidden' },
  createBtnGrad: { padding: 16, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
})
