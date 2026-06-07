import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createNotification } from './useNotifications'

export interface SuggestedUser {
  id: string
  name: string
  profile_image_url: string | null
  country: string | null
  bio: string | null
}

export function useFollow(userId: string) {
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set())
  const [followingProfiles, setFollowingProfiles] = useState<SuggestedUser[]>([])
  const [suggested, setSuggested] = useState<SuggestedUser[]>([])
  const [loadingSuggested, setLoadingSuggested] = useState(true)

  // Load who I already follow + pending requests
  useEffect(() => {
    if (!userId) return
    Promise.all([
      supabase
        .from('follows')
        .select('following_id, profile:profiles!follows_following_id_fkey(id, name, profile_image_url, country, bio)')
        .eq('follower_id', userId),
      supabase.from('follow_requests').select('target_id').eq('requester_id', userId),
    ]).then(([followsRes, requestsRes]) => {
      const data = followsRes.data ?? []
      const ids = new Set<string>(data.map((r: any) => r.following_id))
      setFollowing(ids)
      setFollowingProfiles(data.map((r: any) => r.profile).filter(Boolean) as SuggestedUser[])
      setPendingRequests(new Set((requestsRes.data ?? []).map((r: any) => r.target_id)))
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
    // Check if target account is private
    const { data: profile } = await supabase
      .from('profiles').select('is_private').eq('id', targetId).single()

    if (profile?.is_private) {
      // Send follow request instead of direct follow
      const { error } = await supabase.from('follow_requests')
        .insert({ requester_id: userId, target_id: targetId })
      if (!error) {
        setPendingRequests(prev => new Set([...prev, targetId]))
        createNotification({ userId: targetId, actorId: userId, type: 'follow_request' })
      }
    } else {
      setFollowing(prev => new Set([...prev, targetId]))
      setSuggested(prev => prev.filter(p => p.id !== targetId))
      const { error } = await supabase.from('follows').insert({ follower_id: userId, following_id: targetId })
      if (error) {
        setFollowing(prev => { const n = new Set(prev); n.delete(targetId); return n })
      } else {
        createNotification({ userId: targetId, actorId: userId, type: 'follow' })
      }
    }
  }

  const unfollow = async (targetId: string) => {
    setFollowing(prev => { const n = new Set(prev); n.delete(targetId); return n })
    await supabase.from('follows').delete()
      .eq('follower_id', userId).eq('following_id', targetId)
  }

  const isFollowing = (targetId: string) => following.has(targetId)
  const isPending = (targetId: string) => pendingRequests.has(targetId)

  return { following, pendingRequests, followingProfiles, suggested, loadingSuggested, follow, unfollow, isFollowing, isPending, loadSuggested }
}
