import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { supabase } from '@/src/lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator, FlatList, Image, Pressable,
  StyleSheet, Text, View,
} from 'react-native'

interface Friend {
  id: string
  name: string
  profile_image_url: string | null
  isCloseFriend: boolean
}

export default function CloseFriendsScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const router = useRouter()
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!userId) return
    Promise.all([
      supabase.from('follows')
        .select('following_id, profile:profiles!follows_following_id_fkey(id, name, profile_image_url)')
        .eq('follower_id', userId),
      supabase.from('close_friends').select('friend_id').eq('user_id', userId),
    ]).then(([followsRes, cfRes]) => {
      const cfSet = new Set((cfRes.data ?? []).map((r: any) => r.friend_id))
      setFriends(
        (followsRes.data ?? []).map((r: any) => {
          const p = Array.isArray(r.profile) ? r.profile[0] : r.profile
          return {
            id: r.following_id,
            name: p?.name ?? 'Unbekannt',
            profile_image_url: p?.profile_image_url ?? null,
            isCloseFriend: cfSet.has(r.following_id),
          }
        })
      )
      setLoading(false)
    })
  }, [userId])

  const toggle = async (friendId: string) => {
    const friend = friends.find(f => f.id === friendId)
    if (!friend) return
    setFriends(prev => prev.map(f => f.id === friendId ? { ...f, isCloseFriend: !f.isCloseFriend } : f))
    if (friend.isCloseFriend) {
      await supabase.from('close_friends').delete().eq('user_id', userId).eq('friend_id', friendId)
    } else {
      await supabase.from('close_friends').upsert({ user_id: userId, friend_id: friendId }, { onConflict: 'user_id,friend_id' })
    }
  }

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0d1b2e', '#111d2e']} style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Enge Freunde</Text>
          <Text style={s.headerSub}>Teile Stories nur mit ausgewählten Personen</Text>
        </View>
      </LinearGradient>

      {/* Info banner */}
      <View style={s.infoBanner}>
        <Text style={s.infoText}>
          ⭐ Enge Freunde sehen einen grünen Ring um deine Story. Nur du siehst diese Liste.
        </Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : friends.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>👥</Text>
          <Text style={s.emptyTitle}>Noch niemanden</Text>
          <Text style={s.emptySub}>Folge anderen Nutzern, um sie als enge Freunde hinzuzufügen.</Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={f => f.id}
          contentContainerStyle={{ paddingTop: 8 }}
          renderItem={({ item }) => (
            <Pressable style={s.row} onPress={() => toggle(item.id)}>
              <View style={s.avatarWrap}>
                {item.isCloseFriend && <View style={s.greenRing} />}
                {item.profile_image_url ? (
                  <Image source={{ uri: item.profile_image_url }} style={s.avatar} />
                ) : (
                  <LinearGradient colors={gradients.brand} style={s.avatarFallback}>
                    <Text style={s.avatarInitial}>{item.name.charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                )}
              </View>
              <Text style={s.name}>{item.name}</Text>
              <View style={[s.checkCircle, item.isCloseFriend && s.checkCircleActive]}>
                {item.isCloseFriend && <Text style={s.checkMark}>✓</Text>}
              </View>
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
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: 14,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backText: { fontSize: 26, color: '#fff', fontWeight: '300' },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  infoBanner: {
    backgroundColor: 'rgba(48,209,88,0.1)', margin: 12, borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: 'rgba(48,209,88,0.2)',
  },
  infoText: { fontSize: 13, color: 'rgba(48,209,88,0.9)', lineHeight: 19 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 21 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  avatarWrap: { position: 'relative', width: 50, height: 50 },
  greenRing: {
    position: 'absolute', top: -2, left: -2, right: -2, bottom: -2,
    borderRadius: 29, borderWidth: 2.5, borderColor: '#30d158',
  },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarFallback: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontWeight: '900', fontSize: 20 },
  name: { flex: 1, fontSize: 15, fontWeight: '700', color: '#fff' },
  checkCircle: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  checkCircleActive: { backgroundColor: '#30d158', borderColor: '#30d158' },
  checkMark: { color: '#fff', fontSize: 16, fontWeight: '900' },
})
