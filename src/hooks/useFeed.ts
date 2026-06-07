import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createNotification } from './useNotifications'

export interface PostTag {
  username: string
  x: number
  y: number
}

export interface FeedPost {
  id: string
  user_id: string
  content: string | null
  image_url: string | null
  video_url: string | null
  media_urls: string[] | null
  location: string | null
  type: 'post' | 'repost'
  repost_of: string | null
  like_count: number
  repost_count: number
  comment_count: number
  created_at: string
  tags: PostTag[] | null
  author: {
    name: string
    profile_image_url: string | null
  }
  repost_origin?: FeedPost
  liked_by_me: boolean
  reposted_by_me: boolean
}

export function useFeed(userId: string) {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      // Fetch who I follow to determine private account visibility
      const { data: followData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)
      const followingIds = new Set((followData ?? []).map((r: any) => r.following_id))

      const { data, error } = await supabase
        .from('posts')
        .select('id, user_id, content, image_url, video_url, media_urls, location, type, repost_of, like_count, repost_count, comment_count, created_at, tags')
        .neq('type', 'thread')
        .neq('archived', true)
        .or('image_url.not.is.null,video_url.not.is.null,media_urls.not.is.null,type.eq.repost')
        .order('created_at', { ascending: false })
        .limit(40)

      if (error) { console.warn('Feed query error:', JSON.stringify(error)); throw error }

      // Fetch author profiles with is_private field
      const userIds = [...new Set((data ?? []).map(p => p.user_id))]
      let profilesMap: Record<string, { name: string; profile_image_url: string | null; is_private: boolean }> = {}
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, profile_image_url, is_private')
          .in('id', userIds)
        for (const pr of profilesData ?? []) profilesMap[pr.id] = {
          name: pr.name,
          profile_image_url: pr.profile_image_url,
          is_private: pr.is_private ?? false,
        }
      }

      // Fetch repost origins
      const repostIds = (data ?? [])
        .filter(p => p.repost_of)
        .map(p => p.repost_of as string)

      let originsMap: Record<string, any> = {}
      if (repostIds.length > 0) {
        const { data: origins } = await supabase
          .from('posts')
          .select('id, user_id, content, image_url, location, created_at')
          .in('id', repostIds)
        for (const o of origins ?? []) originsMap[o.id] = { ...o, author: profilesMap[o.user_id] ?? { name: '?', profile_image_url: null } }
      }

      // Filter out private accounts the user doesn't follow (except own posts)
      const visible = (data ?? []).filter(p => {
        if (p.user_id === userId) return true
        const profile = profilesMap[p.user_id]
        if (!profile) return true
        if (profile.is_private && !followingIds.has(p.user_id)) return false
        return true
      })

      const mapped: FeedPost[] = visible.map(p => ({
        id: p.id,
        user_id: p.user_id,
        content: p.content,
        image_url: p.image_url,
        video_url: (p as any).video_url ?? null,
        media_urls: (p as any).media_urls ?? null,
        location: p.location,
        tags: (p as any).tags ?? null,
        type: p.type ?? 'post',
        repost_of: p.repost_of,
        like_count: p.like_count ?? 0,
        repost_count: p.repost_count ?? 0,
        comment_count: p.comment_count ?? 0,
        created_at: p.created_at,
        author: profilesMap[p.user_id] ? { name: profilesMap[p.user_id].name, profile_image_url: profilesMap[p.user_id].profile_image_url } : { name: '?', profile_image_url: null },
        repost_origin: p.repost_of ? originsMap[p.repost_of] : undefined,
        liked_by_me: false,
        reposted_by_me: false,
      }))

      setPosts(mapped)
    } catch (e) {
      console.warn('Feed load error:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userId])

  useEffect(() => { if (userId) load() }, [userId])

  const createPost = async (content: string, imageUrl: string | null, location: string | null, mediaUrls?: string[]) => {
    const { data, error } = await supabase.from('posts').insert({
      user_id: userId,
      content: content || null,
      image_url: imageUrl,
      media_urls: mediaUrls && mediaUrls.length > 1 ? mediaUrls : null,
      location,
      type: 'post',
    }).select().single()
    if (error) throw new Error(error.message)
    await load(true)
    return data
  }

  const repost = async (postId: string) => {
    // Toggle repost
    const post = posts.find(p => p.id === postId)
    if (!post) return
    if (post.reposted_by_me) {
      await supabase.from('post_reposts').delete()
        .eq('post_id', postId).eq('user_id', userId)
      await supabase.from('posts').update({ repost_count: Math.max(0, post.repost_count - 1) }).eq('id', postId)
    } else {
      await supabase.from('post_reposts').upsert({ post_id: postId, user_id: userId }, { onConflict: 'post_id,user_id' })
      await supabase.from('posts').update({ repost_count: post.repost_count + 1 }).eq('id', postId)
      // Create repost entry
      await supabase.from('posts').insert({ user_id: userId, type: 'repost', repost_of: postId })
    }
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      reposted_by_me: !p.reposted_by_me,
      repost_count: p.reposted_by_me ? p.repost_count - 1 : p.repost_count + 1,
    } : p))
  }

  const toggleLike = async (postId: string) => {
    const post = posts.find(p => p.id === postId)
    if (!post) return
    // Optimistic update
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      liked_by_me: !p.liked_by_me,
      like_count: p.liked_by_me ? p.like_count - 1 : p.like_count + 1,
    } : p))
    if (post.liked_by_me) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
      await supabase.from('posts').update({ like_count: Math.max(0, post.like_count - 1) }).eq('id', postId)
    } else {
      await supabase.from('post_likes').upsert({ post_id: postId, user_id: userId }, { onConflict: 'post_id,user_id' })
      await supabase.from('posts').update({ like_count: post.like_count + 1 }).eq('id', postId)
      createNotification({ userId: post.user_id, actorId: userId, type: 'like', postId })
    }
  }

  const deletePost = async (postId: string) => {
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const updatePost = async (postId: string, content: string, location: string | null) => {
    const { error } = await supabase.from('posts')
      .update({ content: content || null, location })
      .eq('id', postId)
    if (error) throw new Error(error.message)
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: content || null, location } : p))
  }

  return { posts, loading, refreshing, load, createPost, repost, toggleLike, deletePost, updatePost }
}
