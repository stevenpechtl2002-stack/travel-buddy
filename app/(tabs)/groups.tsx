import SceneBackground from '@/src/components/SceneBackground'
import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { useGroups, GroupWithRole } from '@/src/hooks/useGroups'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Group } from '@/src/types'

const GROUP_EMOJIS = ['✈️', '🏖️', '🏔️', '🌍', '🎒', '🗺️', '⛺', '🏄', '🚂', '🛳️']
function groupEmoji(id: string) {
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0
  return GROUP_EMOJIS[Math.abs(h) % GROUP_EMOJIS.length]
}

function countdown(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (days < 0) return 'Abgeschlossen'
  if (days === 0) return 'Heute! 🎉'
  if (days === 1) return 'Morgen!'
  return `In ${days} Tagen`
}

function GroupCard({ item, onPress, delay }: { item: GroupWithRole; onPress: () => void; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 380, delay, useNativeDriver: true }).start()
  }, [])
  const cd = countdown(item.date_from)
  const isAdmin = item.myRole === 'admin'
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [24,0] }) }] }}>
      <Pressable style={styles.groupCard} onPress={onPress}>
        <LinearGradient colors={gradients.brand} style={styles.groupEmoji}>
          <Text style={{ fontSize: 24 }}>{groupEmoji(item.id)}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
            {isAdmin && <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>Admin</Text></View>}
          </View>
          {item.destination ? <Text style={styles.groupSub} numberOfLines={1}>📍 {item.destination}</Text> : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Text style={styles.groupMeta}>👥 {item.memberCount}</Text>
            {cd && <View style={[styles.cdBadge, cd === 'Abgeschlossen' && styles.cdDone]}>
              <Text style={styles.cdText}>{cd}</Text>
            </View>}
          </View>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
    </Animated.View>
  )
}

function PublicCard({ item, onJoin, delay }: { item: Group; onJoin: () => void; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 380, delay, useNativeDriver: true }).start()
  }, [])
  const cd = countdown((item as any).date_from)
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [24,0] }) }] }}>
      <View style={styles.groupCard}>
        <LinearGradient colors={['#e8845c','#c9566e']} style={styles.groupEmoji}>
          <Text style={{ fontSize: 24 }}>{groupEmoji(item.id)}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
          {item.destination ? <Text style={styles.groupSub} numberOfLines={1}>📍 {item.destination}</Text> : null}
          {item.description ? <Text style={styles.groupDesc} numberOfLines={1}>{item.description}</Text> : null}
          {cd && <View style={[styles.cdBadge, { marginTop: 4, alignSelf: 'flex-start' }]}>
            <Text style={styles.cdText}>{cd}</Text>
          </View>}
        </View>
        <Pressable onPress={onJoin}>
          <LinearGradient colors={gradients.brand} style={styles.joinBtn}>
            <Text style={styles.joinBtnText}>Beitreten</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Animated.View>
  )
}

export default function GroupsScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const { groups, invitations, publicGroups, loading, acceptInvitation, declineInvitation, joinPublicGroup } = useGroups(userId)
  const router = useRouter()
  const [tab, setTab] = useState<'mine' | 'discover'>('mine')

  return (
    <SceneBackground>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.title}>Gruppen</Text>
            <Text style={styles.subtitle}>Reist gemeinsam weiter ✈️</Text>
          </View>
          <Pressable onPress={() => router.push('/group/create')}>
            <LinearGradient colors={gradients.brand} style={styles.createBtn}>
              <Text style={styles.createBtnText}>+ Neue Gruppe</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['mine', 'discover'] as const).map(t => (
            <Pressable key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {t === 'mine' ? `🏠 Meine (${groups.length})` : '🔍 Entdecken'}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
        ) : tab === 'mine' ? (
          <FlatList
            data={groups}
            keyExtractor={g => g.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={invitations.length > 0 ? (
              <View style={styles.inviteSection}>
                <Text style={styles.sectionLabel}>📬 Einladungen ({invitations.length})</Text>
                {invitations.map(inv => (
                  <View key={inv.id} style={styles.inviteCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <LinearGradient colors={['#e8845c','#c9566e']} style={styles.inviteIcon}>
                        <Text style={{ fontSize: 20 }}>{groupEmoji(inv.id)}</Text>
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inviteName}>{inv.name}</Text>
                        {inv.destination ? <Text style={styles.inviteSub}>📍 {inv.destination}</Text> : null}
                      </View>
                    </View>
                    <View style={styles.inviteActions}>
                      <Pressable style={styles.acceptBtn} onPress={() => acceptInvitation(inv.id)}>
                        <Text style={styles.acceptText}>✓ Annehmen</Text>
                      </Pressable>
                      <Pressable style={styles.declineBtn} onPress={() => declineInvitation(inv.id)}>
                        <Text style={styles.declineText}>Ablehnen</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🌍</Text>
                <Text style={styles.emptyTitle}>Noch keine Gruppen</Text>
                <Text style={styles.emptySub}>Erstelle eine Reisegruppe{'\n'}und lade deine Matches ein!</Text>
                <Pressable onPress={() => router.push('/group/create')}>
                  <LinearGradient colors={gradients.brand} style={styles.emptyBtn}>
                    <Text style={styles.emptyBtnText}>Erste Gruppe erstellen ✈️</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            }
            renderItem={({ item, index }) => (
              <GroupCard item={item} delay={index * 60} onPress={() => router.push(`/group/${item.id}`)} />
            )}
          />
        ) : (
          <FlatList
            data={publicGroups}
            keyExtractor={(g: Group) => g.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>Keine öffentlichen Gruppen</Text>
                <Text style={styles.emptySub}>Sei der Erste und erstelle eine!</Text>
              </View>
            }
            renderItem={({ item, index }: { item: Group; index: number }) => (
              <PublicCard item={item} delay={index * 60} onJoin={() => joinPublicGroup(item.id)} />
            )}
          />
        )}
      </View>
    </SceneBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: 14 },
  title: { fontSize: 30, fontWeight: '900', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  createBtn: { borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10 },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  tabs: { flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 16, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 13 },
  tabBtnActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.45)' },
  tabLabelActive: { color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#fff', marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  inviteSection: { marginBottom: 16 },
  inviteCard: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 18, padding: 14,
    borderWidth: 1.5, borderColor: 'rgba(255,140,0,0.6)', marginBottom: 10 },
  inviteIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  inviteName: { fontSize: 16, fontWeight: '900', color: '#fff' },
  inviteSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  inviteActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, padding: 11, alignItems: 'center' },
  acceptText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  declineBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 11, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  declineText: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 13 },
  groupCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20, padding: 14, marginBottom: 10, gap: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  groupEmoji: { width: 52, height: 52, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  groupName: { fontSize: 15, fontWeight: '900', color: '#fff' },
  groupSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  groupDesc: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  groupMeta: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  cdBadge: { backgroundColor: 'rgba(59,157,224,0.35)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(59,157,224,0.5)' },
  cdDone: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' },
  cdText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  adminBadge: { backgroundColor: 'rgba(255,140,0,0.3)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(255,140,0,0.5)' },
  adminBadgeText: { fontSize: 9, fontWeight: '900', color: '#ffd700' },
  arrow: { fontSize: 22, color: 'rgba(255,255,255,0.4)' },
  joinBtn: { borderRadius: 14, paddingHorizontal: 13, paddingVertical: 10 },
  joinBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 70, gap: 10 },
  emptyIcon: { fontSize: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 20 },
  emptyBtn: { borderRadius: 24, paddingHorizontal: 24, paddingVertical: 13, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
})
