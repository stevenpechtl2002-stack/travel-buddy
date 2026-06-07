import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Notification {
  id: string
  type: 'like' | 'follow' | 'comment' | 'tag' | 'follow_request'
  actor_id: string
  post_id: string | null
  read: boolean
  created_at: string
  actor: { name: string; profile_image_url: string | null }
  post_image_url?: string | null
}

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('id, type, actor_id, post_id, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(60)

    if (!data?.length) { setNotifications([]); setUnreadCount(0); setLoading(false); return }

    const actorIds = [...new Set(data.map(n => n.actor_id))]
    const postIds = data.map(n => n.post_id).filter(Boolean) as string[]

    const [{ data: actors }, { data: posts }] = await Promise.all([
      supabase.from('profiles').select('id, name, profile_image_url').in('id', actorIds),
      postIds.length > 0
        ? supabase.from('posts').select('id, image_url').in('id', postIds)
        : Promise.resolve({ data: [] }),
    ])

    const actorMap = new Map((actors ?? []).map(a => [a.id, a]))
    const postMap = new Map((posts ?? []).map(p => [p.id, p]))

    const mapped: Notification[] = data.map(n => ({
      ...n,
      actor: actorMap.get(n.actor_id) ?? { name: 'Unbekannt', profile_image_url: null },
      post_image_url: n.post_id ? postMap.get(n.post_id)?.image_url ?? null : null,
    }))

    setNotifications(mapped)
    setUnreadCount(mapped.filter(n => !n.read).length)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [userId])

  const markAllRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  return { notifications, unreadCount, loading, load, markAllRead, markRead }
}

export async function createNotification(params: {
  userId: string
  actorId: string
  type: 'like' | 'follow' | 'comment' | 'tag' | 'follow_request'
  postId?: string
}) {
  if (params.userId === params.actorId) return
  await supabase.from('notifications').insert({
    user_id: params.userId,
    actor_id: params.actorId,
    type: params.type,
    post_id: params.postId ?? null,
  })
}

export async function acceptFollowRequest(notifId: string, requesterId: string, targetId: string) {
  await Promise.all([
    supabase.from('follows').insert({ follower_id: requesterId, following_id: targetId }),
    supabase.from('follow_requests').delete().eq('requester_id', requesterId).eq('target_id', targetId),
    supabase.from('notifications').delete().eq('id', notifId),
  ])
  createNotification({ userId: requesterId, actorId: targetId, type: 'follow' })
}

export async function declineFollowRequest(notifId: string, requesterId: string, targetId: string) {
  await Promise.all([
    supabase.from('follow_requests').delete().eq('requester_id', requesterId).eq('target_id', targetId),
    supabase.from('notifications').delete().eq('id', notifId),
  ])
}
