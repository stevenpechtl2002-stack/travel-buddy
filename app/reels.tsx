import { colors, gradients } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { supabase } from '@/src/lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { VideoView, useVideoPlayer } from 'expo-video'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, Dimensions, FlatList, Image, Pressable,
  StyleSheet, Text, View, StatusBar,
} from 'react-native'

const { width, height } = Dimensions.get('window')

interface Reel {
  id: string
  user_id: string
  video_url: string
  content: string | null
  like_count: number
  comment_count: number
  created_at: string
  author: { name: string; profile_image_url: string | null }
}

function ReelPlayer({ uri, active }: { uri: string; active: boolean }) {
  const player = useVideoPlayer(uri, p => {
    p.loop = true
    if (active) p.play()
    else p.pause()
  })

  useEffect(() => {
    if (active) player.play()
    else player.pause()
  }, [active])

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  )
}

function ReelItem({ item, active, userId, onToggleLike, liked }: {
  item: Reel; active: boolean; userId: string
  onToggleLike: () => void; liked: boolean
}) {
  return (
    <View style={s.reel}>
      <ReelPlayer uri={item.video_url} active={active} />

      {/* Dark gradient at bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={s.bottomGrad}
      />

      {/* Right actions */}
      <View style={s.actions}>
        <Pressable style={s.actionBtn} onPress={onToggleLike}>
          <Text style={[s.actionIcon, liked && { color: '#ff3b30' }]}>{liked ? '♥' : '♡'}</Text>
          <Text style={s.actionCount}>{item.like_count}</Text>
        </Pressable>
        <View style={s.actionBtn}>
          <Text style={s.actionIcon}>💬</Text>
          <Text style={s.actionCount}>{item.comment_count}</Text>
        </View>
        <View style={s.actionBtn}>
          <Text style={s.actionIcon}>↗</Text>
        </View>
      </View>

      {/* Bottom info */}
      <View style={s.info}>
        {item.author.profile_image_url ? (
          <Image source={{ uri: item.author.profile_image_url }} style={s.avatar} />
        ) : (
          <LinearGradient colors={gradients.brand} style={s.avatarFallback}>
            <Text style={s.avatarInitial}>{item.author.name.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.authorName}>{item.author.name}</Text>
          {item.content ? <Text style={s.caption} numberOfLines={2}>{item.content}</Text> : null}
        </View>
      </View>
    </View>
  )
}

export default function ReelsScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const router = useRouter()
  const [reels, setReels] = useState<Reel[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    const { data: posts } = await supabase
      .from('posts')
      .select('id, user_id, video_url, content, like_count, comment_count, created_at')
      .not('video_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(30)

    if (!posts?.length) { setReels([]); setLoading(false); return }

    const uids = [...new Set(posts.map(p => p.user_id))]
    const { data: profiles } = await supabase.from('profiles').select('id, name, profile_image_url').in('id', uids)
    const pm = new Map((profiles ?? []).map(p => [p.id, p]))

    setReels(posts.map(p => ({
      id: p.id,
      user_id: p.user_id,
      video_url: p.video_url!,
      content: p.content,
      like_count: p.like_count ?? 0,
      comment_count: p.comment_count ?? 0,
      created_at: p.created_at,
      author: pm.get(p.user_id) ?? { name: '?', profile_image_url: null },
    })))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [])

  const toggleLike = async (reelId: string) => {
    const reel = reels.find(r => r.id === reelId)
    if (!reel) return
    const isLiked = likedIds.has(reelId)
    setLikedIds(prev => {
      const n = new Set(prev)
      if (isLiked) n.delete(reelId)
      else n.add(reelId)
      return n
    })
    setReels(prev => prev.map(r => r.id === reelId ? {
      ...r, like_count: isLiked ? r.like_count - 1 : r.like_count + 1
    } : r))
    if (isLiked) {
      await supabase.from('post_likes').delete().eq('post_id', reelId).eq('user_id', userId)
      await supabase.from('posts').update({ like_count: Math.max(0, reel.like_count - 1) }).eq('id', reelId)
    } else {
      await supabase.from('post_likes').upsert({ post_id: reelId, user_id: userId }, { onConflict: 'post_id,user_id' })
      await supabase.from('posts').update({ like_count: reel.like_count + 1 }).eq('id', reelId)
    }
  }

  if (loading) return (
    <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  )

  return (
    <View style={s.root}>
      <StatusBar hidden />
      {/* Back button */}
      <Pressable style={s.backBtn} onPress={() => router.back()}>
        <Text style={s.backText}>‹</Text>
      </Pressable>

      <FlatList
        data={reels}
        keyExtractor={r => r.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          const i = Math.round(e.nativeEvent.contentOffset.y / height)
          setActiveIndex(i)
        }}
        getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
        ListEmptyComponent={
          <View style={[s.reel, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🎬</Text>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>Noch keine Reels</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 8 }}>
              Poste Videos im Feed, um sie hier zu sehen.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <ReelItem
            item={item}
            active={index === activeIndex}
            userId={userId}
            liked={likedIds.has(item.id)}
            onToggleLike={() => toggleLike(item.id)}
          />
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  reel: { width, height },
  bottomGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 220 },
  backBtn: {
    position: 'absolute', top: 52, left: 16, zIndex: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center',
  },
  backText: { color: '#fff', fontSize: 22, fontWeight: '300' },
  actions: {
    position: 'absolute', right: 12, bottom: 100, zIndex: 10,
    alignItems: 'center', gap: 20,
  },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionIcon: { fontSize: 30, color: '#fff' },
  actionCount: { fontSize: 12, color: '#fff', fontWeight: '700' },
  info: {
    position: 'absolute', left: 12, right: 80, bottom: 40, zIndex: 10,
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  avatarFallback: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarInitial: { color: '#fff', fontWeight: '900', fontSize: 16 },
  authorName: { color: '#fff', fontWeight: '800', fontSize: 14, marginBottom: 4 },
  caption: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 18 },
})
