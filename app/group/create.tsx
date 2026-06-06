import SceneBackground from '@/src/components/SceneBackground'
import WheelDatePicker from '@/src/components/WheelDatePicker'
import NumberWheelPicker from '@/src/components/NumberWheelPicker'
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

const EMOJI_OPTIONS = ['✈️', '🏖️', '🏔️', '🌍', '🎒', '🗺️', '⛺', '🏄', '🚂', '🛳️']

export default function CreateGroupScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const { matches } = useMatches(userId)
  const router = useRouter()
  const { preselectedMatchId } = useLocalSearchParams<{ preselectedMatchId?: string }>()

  const [emoji, setEmoji] = useState('✈️')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [destination, setDestination] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [maxMembers, setMaxMembers] = useState<number | null>(null)
  const [allowedGender, setAllowedGender] = useState<'all' | 'male' | 'female'>('all')
  const [allowedReligion, setAllowedReligion] = useState('all')
  const [selectedIds, setSelectedIds] = useState<string[]>(preselectedMatchId ? [preselectedMatchId] : [])
  const [loading, setLoading] = useState(false)

  const toggleMatch = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert('Fehler', 'Bitte gib einen Gruppennamen ein.'); return }
    setLoading(true)
    try {
      const { data: group, error } = await supabase.from('groups').insert({
        name: `${emoji} ${name.trim()}`,
        description: description.trim() || null,
        destination: destination.trim() || null,
        date_from: dateFrom || null,
        date_to: dateTo || null,
        is_public: isPublic,
        max_members: maxMembers,
        allowed_gender: allowedGender,
        allowed_religion: allowedReligion,
        created_by: userId,
      }).select().single()

      if (error || !group) throw new Error(error?.message ?? 'Fehler')

      await supabase.from('group_members').insert({
        group_id: group.id, user_id: userId, role: 'admin', status: 'active', joined_at: new Date().toISOString()
      })

      for (const id of selectedIds) {
        await supabase.from('group_members').insert({
          group_id: group.id, user_id: id, role: 'member', status: 'invited'
        })
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

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Emoji Picker */}
          <Text style={styles.label}>Gruppen-Icon</Text>
          <View style={styles.emojiRow}>
            {EMOJI_OPTIONS.map(e => (
              <Pressable key={e} style={[styles.emojiBtn, emoji === e && styles.emojiBtnActive]} onPress={() => setEmoji(e)}>
                <Text style={styles.emojiText}>{e}</Text>
              </Pressable>
            ))}
          </View>

          {/* Preview */}
          <View style={styles.previewCard}>
            <LinearGradient colors={gradients.brand} style={styles.previewIcon}>
              <Text style={{ fontSize: 26 }}>{emoji}</Text>
            </LinearGradient>
            <Text style={styles.previewName}>{name || 'Gruppenname'}</Text>
          </View>

          <Text style={styles.label}>Gruppenname *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName}
            placeholder="z.B. Bali Squad 2025" placeholderTextColor="#aaa" />

          <Text style={styles.label}>Beschreibung</Text>
          <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription}
            placeholder="Was plant ihr?" placeholderTextColor="#aaa" multiline numberOfLines={3} />

          <Text style={styles.label}>Reiseziel</Text>
          <TextInput style={styles.input} value={destination} onChangeText={setDestination}
            placeholder="z.B. Bali, Indonesien" placeholderTextColor="#aaa" />

          <Text style={styles.label}>Reisedaten</Text>
          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateSub}>Von</Text>
              <WheelDatePicker value={dateFrom || null} onChange={setDateFrom} />
            </View>
            <View style={styles.dateDivider} />
            <View style={{ flex: 1 }}>
              <Text style={styles.dateSub}>Bis</Text>
              <WheelDatePicker value={dateTo || null} onChange={setDateTo} />
            </View>
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>Öffentliche Gruppe</Text>
              <Text style={styles.switchSub}>Jeder kann beitreten</Text>
            </View>
            <Switch value={isPublic} onValueChange={setIsPublic}
              trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.15)' }} thumbColor="#fff" />
          </View>

          {/* Max Members */}
          <Text style={styles.label}>Max. Mitglieder</Text>
          <View style={styles.maxMembersRow}>
            <View style={styles.chipCol}>
              {[null, 5, 10, 20, 50].map(n => (
                <Pressable key={String(n)} style={[styles.chip, maxMembers === n && styles.chipActive]} onPress={() => setMaxMembers(n)}>
                  <Text style={[styles.chipText, maxMembers === n && styles.chipTextActive]}>
                    {n === null ? '∞ Unbegrenzt' : `${n} Personen`}
                  </Text>
                </Pressable>
              ))}
            </View>
            <NumberWheelPicker value={maxMembers ?? 10} onChange={n => setMaxMembers(n)} />
          </View>

          {/* Allowed Gender */}
          <Text style={styles.label}>Geschlecht</Text>
          <View style={styles.chipRow}>
            {([['all', '👥 Alle'], ['male', '♂ Männlich'], ['female', '♀ Weiblich']] as const).map(([val, label]) => (
              <Pressable key={val} style={[styles.chip, allowedGender === val && styles.chipActive]} onPress={() => setAllowedGender(val)}>
                <Text style={[styles.chipText, allowedGender === val && styles.chipTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Allowed Religion */}
          <Text style={styles.label}>Religion</Text>
          <View style={styles.chipRow}>
            {[
              ['all', '🌍 Alle'],
              ['christian', '✝️ Christlich'],
              ['muslim', '☪️ Islamisch'],
              ['hindu', '🕉 Hinduistisch'],
              ['buddhist', '☸️ Buddhistisch'],
              ['jewish', '✡️ Jüdisch'],
              ['none', '⚪ Keine'],
            ].map(([val, label]) => (
              <Pressable key={val} style={[styles.chip, allowedReligion === val && styles.chipActive]} onPress={() => setAllowedReligion(val)}>
                <Text style={[styles.chipText, allowedReligion === val && styles.chipTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {matches.length > 0 && (
            <>
              <Text style={styles.label}>Matches einladen</Text>
              {matches.map(match => {
                const sel = selectedIds.includes(match.other_user.id)
                return (
                  <Pressable key={match.id} style={[styles.matchRow, sel && styles.matchRowSel]}
                    onPress={() => toggleMatch(match.other_user.id)}>
                    <View style={styles.matchAvatar}>
                      <Text style={{ fontSize: 18 }}>👤</Text>
                    </View>
                    <Text style={styles.matchName}>{match.other_user.name}, {match.other_user.age}</Text>
                    <Text style={{ fontSize: 20 }}>{sel ? '✅' : '⬜'}</Text>
                  </Pressable>
                )
              })}
            </>
          )}

          <Pressable style={[styles.createBtn, loading && { opacity: 0.6 }]} onPress={handleCreate} disabled={loading}>
            <LinearGradient colors={gradients.brand} style={styles.createBtnGrad}>
              <Text style={styles.createBtnText}>{loading ? 'Wird erstellt…' : `${emoji} Gruppe erstellen`}</Text>
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
  form: { padding: spacing.lg, paddingBottom: 120 },
  label: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.75)', marginBottom: 8, marginTop: 18, letterSpacing: 0.5, textTransform: 'uppercase' },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  emojiBtnActive: { backgroundColor: 'rgba(255,140,0,0.3)', borderColor: colors.primary },
  emojiText: { fontSize: 26 },
  previewCard: { flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 18, padding: 14, marginTop: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  previewIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  previewName: { fontSize: 16, fontWeight: '900', color: '#fff', flex: 1 },
  input: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 14, padding: 13, fontSize: 15, color: '#1a1a2e' },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  dateRow: { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  dateSub: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 4 },
  dateDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 18, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  switchSub: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 14, padding: 12, marginBottom: 8 },
  matchRowSel: { borderWidth: 2, borderColor: colors.primary },
  matchAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e0e0e0',
    justifyContent: 'center', alignItems: 'center' },
  matchName: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  maxMembersRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  chipCol: { flex: 1, gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)' },
  chipActive: { backgroundColor: 'rgba(232,132,92,0.25)', borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  chipTextActive: { color: '#fff' },
  createBtn: { marginTop: 28, borderRadius: 50, overflow: 'hidden' },
  createBtnGrad: { padding: 17, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
})
