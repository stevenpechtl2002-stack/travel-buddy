import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { FeedPost } from './useFeed'

export function useSaved(userId: string) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [savedPosts, setSavedPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    supabase.from('saved_posts').select('post_id').eq('user_id', userId)
      .then(({ data }) => setSavedIds(new Set((data ?? []).map((r: any) => r.post_id))))
  }, [userId])

  const loadSaved = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data: saved } = await supabase
      .from('saved_posts').select('post_id').eq('user_id', userId)
      .order('created_at', { ascending: false })
    const ids = (saved ?? []).map((r: any) => r.post_id)
    if (!ids.length) { setSavedPosts([]); setLoading(false); return }

    const { data: posts } = await supabase
      .from('posts')
      .select('id, user_id, content, image_url, video_url, media_urls, location, type, repost_of, like_count, repost_count, comment_count, created_at, tags')
      .in('id', ids)

    const uids = [...new Set((posts ?? []).map((p: any) => p.user_id))]
    const { data: profiles } = await supabase.from('profiles').select('id, name, profile_image_url').in('id', uids)
    const pm = new Map((profiles ?? []).map(p => [p.id, p]))

    setSavedPosts((posts ?? []).map((p: any) => ({
      ...p, tags: p.tags ?? null, video_url: p.video_url ?? null, media_urls: p.media_urls ?? null,
      author: pm.get(p.user_id) ?? { name: '?', profile_image_url: null },
      liked_by_me: false, reposted_by_me: false,
    })))
    setLoading(false)
  }, [userId])

  const toggleSave = async (postId: string) => {
    if (savedIds.has(postId)) {
      setSavedIds(prev => { const n = new Set(prev); n.delete(postId); return n })
      setSavedPosts(prev => prev.filter(p => p.id !== postId))
      await supabase.from('saved_posts').delete().eq('user_id', userId).eq('post_id', postId)
    } else {
      setSavedIds(prev => new Set([...prev, postId]))
      await supabase.from('saved_posts').upsert({ user_id: userId, post_id: postId }, { onConflict: 'user_id,post_id' })
    }
  }

  const isSaved = (postId: string) => savedIds.has(postId)

  return { savedIds, savedPosts, loading, loadSaved, toggleSave, isSaved }
}
