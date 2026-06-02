import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Message } from '../types'

export function useChat(matchId: string, userId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!matchId) return
    let active = true

    const loadMessages = async () => {
      const { data, error: fetchError } = await supabase
        .from('messages').select('*')
        .eq('match_id', matchId).order('created_at', { ascending: true })
      if (!active) return
      if (fetchError) {
        setError(fetchError.message)
      } else {
        setMessages(data ?? [])
      }
      setLoading(false)
    }

    loadMessages()

    const channel = supabase
      .channel(`chat:${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `match_id=eq.${matchId}`,
      }, (payload: { new: Message }) => {
        if (active) setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [matchId])

  const sendMessage = async (content: string) => {
    const { error: sendError } = await supabase
      .from('messages').insert({ match_id: matchId, sender_id: userId, content })
    if (sendError) throw new Error(sendError.message)
  }

  return { messages, loading, error, sendMessage }
}
