import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { useNotifications, acceptFollowRequest, declineFollowRequest } from '@/src/hooks/useNotifications'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import {
  ActivityIndicator, FlatList, Image, Pressable,
  StyleSheet, Text, View,
} from 'react-native'

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'gerade eben'
  if (s < 3600) return `vor ${Math.floor(s / 60)} Min`
  if (s < 86400) return `vor ${Math.floor(s / 3600)} Std`
  return `vor ${Math.floor(s / 86400)} T`
}

function notifText(type: string, name: string) {
  switch (type) {
    case 'like': return `${name} hat dein Bild oder Video geliked.`
    case 'follow': return `${name} folgt dir jetzt.`
    case 'comment': return `${name} hat deinen Beitrag kommentiert.`
    case 'tag': return `${name} hat dich in einem Beitrag markiert.`
    case 'follow_request': return `${name} möchte dir folgen.`
    default: return `${name} hat mit dir interagiert.`
  }
}

function notifIcon(type: string) {
  switch (type) {
    case 'like': return '♥'
    case 'follow': return '👤'
    case 'comment': return '💬'
    case 'tag': return '🏷'
    case 'follow_request': return '➕'
    default: return '🔔'
  }
}

export default function NotificationsScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const router = useRouter()
  const { notifications, loading, markAllRead, load, markRead } = useNotifications(userId)

  const handleAccept = async (notifId: string, actorId: string) => {
    await acceptFollowRequest(notifId, actorId, userId)
    load()
  }

  const handleDecline = async (notifId: string, actorId: string) => {
    await declineFollowRequest(notifId, actorId, userId)
    load()
  }

  useEffect(() => { load() }, [])

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0d1b2e', '#111d2e']} style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </Pressable>
        <Text style={s.headerTitle}>Benachrichtigungen</Text>
        <Pressable onPress={markAllRead} style={s.readAllBtn}>
          <Text style={s.readAllText}>Alle gelesen</Text>
        </Pressable>
      </LinearGradient>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : notifications.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🔔</Text>
          <Text style={s.emptyText}>Noch keine Benachrichtigungen</Text>
          <Text style={s.emptySubText}>Wenn jemand deinen Beitrag liked oder dir folgt, siehst du es hier.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => n.id}
          refreshing={loading}
          onRefresh={load}
          renderItem={({ item }) => (
            <Pressable style={[s.row, !item.read && s.rowUnread]}>
              <View style={s.avatarWrap}>
                {item.actor.profile_image_url ? (
                  <Image source={{ uri: item.actor.profile_image_url }} style={s.avatar} />
                ) : (
                  <LinearGradient colors={gradients.brand} style={s.avatarFallback}>
                    <Text style={s.avatarInitial}>{item.actor.name.charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                )}
                <View style={s.iconBadge}>
                  <Text style={s.iconBadgeText}>{notifIcon(item.type)}</Text>
                </View>
              </View>

              <View style={s.content}>
                <Text style={s.notifText}>
                  <Text style={s.notifName}>{item.actor.name}</Text>
                  {' '}
                  <Text style={s.notifMsg}>{notifText(item.type, '').replace(item.actor.name + ' ', '')}</Text>
                </Text>
                <Text style={s.timeText}>{timeAgo(item.created_at)}</Text>
              </View>

              {item.type === 'follow_request' ? (
                <View style={s.requestBtns}>
                  <Pressable style={s.acceptBtn} onPress={() => handleAccept(item.id, item.actor_id)}>
                    <Text style={s.acceptText}>Annehmen</Text>
                  </Pressable>
                  <Pressable style={s.declineBtn} onPress={() => handleDecline(item.id, item.actor_id)}>
                    <Text style={s.declineText}>Ablehnen</Text>
                  </Pressable>
                </View>
              ) : item.post_image_url ? (
                <Image source={{ uri: item.post_image_url }} style={s.postThumb} />
              ) : null}
              {!item.read && <View style={s.unreadDot} />}
            </Pressable>
          )}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: 14,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backText: { fontSize: 26, color: '#fff', fontWeight: '300' },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },
  readAllBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  readAllText: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 8 },
  emptySubText: { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 21 },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg,
    paddingVertical: 14, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  rowUnread: { backgroundColor: 'rgba(232,132,92,0.06)' },
  avatarWrap: { position: 'relative', width: 50, height: 50 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarFallback: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontWeight: '900', fontSize: 20 },
  iconBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#111d2e', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.background,
  },
  iconBadgeText: { fontSize: 11 },
  content: { flex: 1 },
  notifText: { fontSize: 14, color: '#fff', lineHeight: 20 },
  notifName: { fontWeight: '800' },
  notifMsg: { color: 'rgba(255,255,255,0.7)' },
  timeText: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 },
  postThumb: { width: 46, height: 46, borderRadius: 8 },
  requestBtns: { flexDirection: 'column', gap: 6 },
  acceptBtn: {
    backgroundColor: colors.primary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  acceptText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  declineBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  declineText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '700' },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.primary, marginLeft: 4,
  },
})
