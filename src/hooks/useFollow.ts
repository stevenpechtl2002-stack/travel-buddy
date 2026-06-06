import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface SuggestedUser {
  id: string
  name: string
  profile_image_url: string | null
  country: string | null
  bio: string | null
}

export function useFollow(userId: string) {
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const [suggested, setSuggested] = useState<SuggestedUser[]>([])
  const [loadingSuggested, setLoadingSuggested] = useState(true)

  // Load who I already follow
  useEffect(() => {
    if (!userId) return
    supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)
      .then(({ data }) => {
        if (data) setFollowing(new Set(data.map((r: any) => r.following_id)))
      })
  }, [userId])

  // Load suggested: profiles I don't follow and haven't swiped
  const loadSuggested = useCallback(async () => {
    if (!userId) return
    setLoadingSuggested(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, profile_image_url, country, bio')
        .neq('id', userId)
        .limit(20)
      setSuggested((data ?? []).filter((p: SuggestedUser) => !following.has(p.id)))
    } finally {
      setLoadingSuggested(false)
    }
  }, [userId, following])

  useEffect(() => { loadSuggested() }, [userId])

  const follow = async (targetId: string) => {
    setFollowing(prev => new Set([...prev, targetId]))
    setSuggested(prev => prev.filter(p => p.id !== targetId))
    const { error } = await supabase.from('follows').insert({ follower_id: userId, following_id: targetId })
    if (error) {
      // rollback
      setFollowing(prev => { const n = new Set(prev); n.delete(targetId); return n })
    }
  }

  const unfollow = async (targetId: string) => {
    setFollowing(prev => { const n = new Set(prev); n.delete(targetId); return n })
    await supabase.from('follows').delete()
      .eq('follower_id', userId).eq('following_id', targetId)
  }

  const isFollowing = (targetId: string) => following.has(targetId)

  return { following, suggested, loadingSuggested, follow, unfollow, isFollowing, loadSuggested }
}
