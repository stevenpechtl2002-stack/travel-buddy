import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Message } from '../types'

export function useChat(matchId: string, userId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!matchId) return
    loadMessages()
    const channel = supabase
      .channel(`chat:${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `match_id=eq.${matchId}`,
      }, (payload: { new: Message }) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [matchId])

  const loadMessages = async () => {
    const { data } = await supabase.from('messages').select('*')
      .eq('match_id', matchId).order('created_at', { ascending: true })
    setMessages(data ?? [])
    setLoading(false)
  }

  const sendMessage = async (content: string) => {
    await supabase.from('messages').insert({ match_id: matchId, sender_id: userId, content })
  }

  return { messages, loading, sendMessage }
}
