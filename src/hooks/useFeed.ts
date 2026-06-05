import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface FeedPost {
  id: string
  user_id: string
  content: string | null
  image_url: string | null
  location: string | null
  type: 'post' | 'repost'
  repost_of: string | null
  like_count: number
  repost_count: number
  comment_count: number
  created_at: string
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
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, user_id, content, image_url, location, type, repost_of,
          like_count, repost_count, comment_count, created_at,
          author:profiles!posts_user_id_fkey(name, profile_image_url),
          my_likes:post_likes!left(id),
          my_reposts:post_reposts!left(id)
        `)
        .order('created_at', { ascending: false })
        .limit(40)

      if (error) throw error

      // Fetch repost origins
      const repostIds = (data ?? [])
        .filter(p => p.repost_of)
        .map(p => p.repost_of as string)

      let originsMap: Record<string, any> = {}
      if (repostIds.length > 0) {
        const { data: origins } = await supabase
          .from('posts')
          .select('id, user_id, content, image_url, location, created_at, author:profiles!posts_user_id_fkey(name, profile_image_url)')
          .in('id', repostIds)
        for (const o of origins ?? []) originsMap[o.id] = o
      }

      const mapped: FeedPost[] = (data ?? []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        content: p.content,
        image_url: p.image_url,
        location: p.location,
        type: p.type,
        repost_of: p.repost_of,
        like_count: p.like_count ?? 0,
        repost_count: p.repost_count ?? 0,
        comment_count: p.comment_count ?? 0,
        created_at: p.created_at,
        author: Array.isArray(p.author) ? p.author[0] : p.author,
        repost_origin: p.repost_of ? originsMap[p.repost_of] : undefined,
        liked_by_me: Array.isArray(p.my_likes) ? p.my_likes.length > 0 : false,
        reposted_by_me: Array.isArray(p.my_reposts) ? p.my_reposts.length > 0 : false,
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

  const createPost = async (content: string, imageUrl: string | null, location: string | null) => {
    const { data, error } = await supabase.from('posts').insert({
      user_id: userId,
      content: content || null,
      image_url: imageUrl,
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
    }
  }

  const deletePost = async (postId: string) => {
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  return { posts, loading, refreshing, load, createPost, repost, toggleLike, deletePost }
}
