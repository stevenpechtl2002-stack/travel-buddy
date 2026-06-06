import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Story {
  id: string
  user_id: string
  image_url: string
  caption: string | null
  created_at: string
  expires_at: string
}

export interface StoryGroup {
  user_id: string
  name: string
  profile_image_url: string | null
  stories: Story[]
  seen: boolean       // true if user has seen ALL stories in this group
  isMe: boolean
}

export function useStories(userId: string) {
  const [groups, setGroups] = useState<StoryGroup[]>([])
  const [loading, setLoading] = useState(true)
  // Track which story IDs the current user has seen (local session only)
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      // Fetch active stories (not expired) from last 24h
      const { data: storiesData } = await supabase
        .from('stories')
        .select('id, user_id, image_url, caption, created_at, expires_at')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (!storiesData?.length) { setGroups([]); setLoading(false); return }

      // Fetch profiles for all story authors
      const authorIds = [...new Set(storiesData.map(s => s.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, profile_image_url')
        .in('id', authorIds)

      const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

      // Group stories by user
      const groupMap = new Map<string, StoryGroup>()
      for (const story of storiesData) {
        const prof = profileMap.get(story.user_id)
        if (!groupMap.has(story.user_id)) {
          groupMap.set(story.user_id, {
            user_id: story.user_id,
            name: prof?.name ?? 'Unbekannt',
            profile_image_url: prof?.profile_image_url ?? null,
            stories: [],
            seen: false,
            isMe: story.user_id === userId,
          })
        }
        groupMap.get(story.user_id)!.stories.push(story)
      }

      // Sort: my stories first, then unseen, then seen
      const sorted = [...groupMap.values()].sort((a, b) => {
        if (a.isMe) return -1
        if (b.isMe) return 1
        return 0
      })

      setGroups(sorted)
    } catch (e) {
      console.warn('Stories load error:', e)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [userId])

  const markSeen = (storyIds: string[]) => {
    setSeenIds(prev => {
      const next = new Set(prev)
      storyIds.forEach(id => next.add(id))
      return next
    })
    // Update groups seen state
    setGroups(prev => prev.map(g => ({
      ...g,
      seen: g.stories.every(s => seenIds.has(s.id) || storyIds.includes(s.id)),
    })))
  }

  const addStory = async (imageUrl: string, caption: string | null) => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const { error } = await supabase.from('stories').insert({
      user_id: userId,
      image_url: imageUrl,
      caption,
      expires_at: expiresAt,
    })
    if (error) throw new Error(error.message)
    await load()
  }

  const isGroupSeen = (group: StoryGroup) =>
    group.stories.every(s => seenIds.has(s.id))

  return { groups, loading, load, addStory, markSeen, isGroupSeen, seenIds }
}
