import SceneBackground from '@/src/components/SceneBackground'
import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { useGroups } from '@/src/hooks/useGroups'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, Animated, FlatList, Pressable,
  StyleSheet, Text, View,
} from 'react-native'
import { Group } from '@/src/types'
import { GroupWithRole } from '@/src/hooks/useGroups'

function GroupRow({ item, onPress, delay }: { item: GroupWithRole; onPress: () => void; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 350, delay, useNativeDriver: true }).start()
  }, [])
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [20,0] }) }] }}>
      <Pressable style={styles.groupRow} onPress={onPress}>
        <LinearGradient colors={gradients.brand} style={styles.groupIcon}>
          <Text style={{ fontSize: 22 }}>👥</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.groupName}>{item.name}</Text>
          {item.destination ? <Text style={styles.groupSub}>📍 {item.destination}</Text> : null}
          <Text style={styles.groupMeta}>{item.memberCount} Mitglieder · {item.myRole === 'admin' ? '⭐ Admin' : item.myRole === 'moderator' ? '🔧 Mod' : '👤 Mitglied'}</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
    </Animated.View>
  )
}

function PublicRow({ item, onJoin, delay }: { item: Group; onJoin: () => void; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 350, delay, useNativeDriver: true }).start()
  }, [])
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [20,0] }) }] }}>
      <View style={styles.publicCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.groupName}>{item.name}</Text>
          {item.destination ? <Text style={styles.groupSub}>📍 {item.destination}</Text> : null}
          {item.description ? <Text style={styles.groupDesc} numberOfLines={2}>{item.description}</Text> : null}
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
        <View style={styles.topBar}>
          <Text style={styles.title}>Gruppen 👥</Text>
          <Pressable onPress={() => router.push('/group/create')} accessibilityRole="button">
            <LinearGradient colors={gradients.brand} style={styles.createBtn}>
              <Text style={styles.createBtnText}>+ Neu</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {(['mine','discover'] as const).map(t => (
            <Pressable key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {t === 'mine' ? 'Meine Gruppen' : '🔍 Entdecken'}
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
            ListHeaderComponent={invitations.length > 0 ? (
              <View style={styles.inviteSection}>
                <Text style={styles.sectionLabel}>📬 Einladungen</Text>
                {invitations.map(inv => (
                  <View key={inv.id} style={styles.inviteCard}>
                    <Text style={styles.inviteName}>{inv.name}</Text>
                    {inv.destination ? <Text style={styles.inviteSub}>📍 {inv.destination}</Text> : null}
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
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>Noch keine Gruppen</Text>
                <Text style={styles.emptySub}>Erstelle eine Gruppe oder werde eingeladen</Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <GroupRow item={item} delay={index * 70} onPress={() => router.push(`/group/${item.id}`)} />
            )}
          />
        ) : (
          <FlatList
            data={publicGroups}
            keyExtractor={(g: Group) => g.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>Keine öffentlichen Gruppen</Text>
              </View>
            }
            renderItem={({ item, index }: { item: Group; index: number }) => (
              <PublicRow item={item} delay={index * 70} onJoin={() => joinPublicGroup(item.id)} />
            )}
          />
        )}
      </View>
    </SceneBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 30, fontWeight: '900', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  createBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  tabs: { flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 14, padding: 3 },
  tabBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 12 },
  tabBtnActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  tabLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  tabLabelActive: { color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#fff', marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  inviteSection: { marginBottom: 16 },
  inviteCard: { backgroundColor: 'rgba(255,140,0,0.15)', borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: 'rgba(255,140,0,0.4)', marginBottom: 8 },
  inviteName: { fontSize: 16, fontWeight: '900', color: '#fff', marginBottom: 2 },
  inviteSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  inviteActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 10, padding: 10, alignItems: 'center' },
  acceptText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  declineBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 10, alignItems: 'center' },
  declineText: { color: 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 13 },
  groupRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 18, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  groupIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  groupName: { fontSize: 15, fontWeight: '900', color: '#1a1a2e', marginBottom: 2 },
  groupSub: { fontSize: 12, color: '#555', marginBottom: 2 },
  groupMeta: { fontSize: 11, color: '#888' },
  groupDesc: { fontSize: 12, color: '#666', marginTop: 4 },
  arrow: { fontSize: 22, color: '#bbb' },
  publicCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 18, padding: 14, marginBottom: 10, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  joinBtn: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  joinBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 52 },
  emptyText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
})
