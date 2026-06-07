import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Highlight {
  id: string
  user_id: string
  name: string
  cover_url: string | null
  created_at: string
  story_count?: number
}

export interface HighlightStory {
  id: string
  highlight_id: string
  story_id: string | null
  image_url: string
  media_type: 'image' | 'video'
  created_at: string
}

export function useHighlights(userId: string) {
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('story_highlights')
      .select('id, user_id, name, cover_url, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    setHighlights(data ?? [])
    setLoading(false)
  }, [userId])

  const loadStories = async (highlightId: string): Promise<HighlightStory[]> => {
    const { data } = await supabase
      .from('highlight_stories')
      .select('id, highlight_id, story_id, image_url, media_type, created_at')
      .eq('highlight_id', highlightId)
      .order('created_at', { ascending: true })
    return (data ?? []).map((s: any) => ({ ...s, media_type: s.media_type ?? 'image' }))
  }

  const createHighlight = async (name: string, imageUrl: string, mediaType: 'image' | 'video' = 'image', storyId?: string): Promise<Highlight> => {
    const { data, error } = await supabase
      .from('story_highlights')
      .insert({ user_id: userId, name, cover_url: imageUrl })
      .select().single()
    if (error) throw new Error(error.message)
    await supabase.from('highlight_stories').insert({
      highlight_id: data.id,
      story_id: storyId ?? null,
      image_url: imageUrl,
      media_type: mediaType,
    })
    await load()
    return data
  }

  const addToHighlight = async (highlightId: string, imageUrl: string, mediaType: 'image' | 'video' = 'image', storyId?: string) => {
    await supabase.from('highlight_stories').insert({
      highlight_id: highlightId,
      story_id: storyId ?? null,
      image_url: imageUrl,
      media_type: mediaType,
    })
    // Update cover to latest
    await supabase.from('story_highlights').update({ cover_url: imageUrl }).eq('id', highlightId)
    await load()
  }

  const deleteHighlight = async (highlightId: string) => {
    await supabase.from('highlight_stories').delete().eq('highlight_id', highlightId)
    await supabase.from('story_highlights').delete().eq('id', highlightId)
    setHighlights(prev => prev.filter(h => h.id !== highlightId))
  }

  return { highlights, loading, load, loadStories, createHighlight, addToHighlight, deleteHighlight }
}
