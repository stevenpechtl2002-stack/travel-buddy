import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Message } from '../types'

const DEMO_REPLIES = [
  'Hey! 😊 Schön von dir zu hören!',
  'Oh wow, das klingt super! Wann bist du dort?',
  'Ich war auch schon dort, absolut wunderschön! 🌍',
  'Das ist ja ein Zufall, ich plane auch eine Reise dorthin!',
  'Haha ja, Reisen ist einfach das Beste ✈️',
  'Erzähl mir mehr! Wo genau willst du hin?',
  'Das klingt nach einem perfekten Abenteuer 🏔️',
  'Ja total! Vielleicht können wir uns ja sogar treffen 😄',
]

// In-memory Nachrichten für Demo-Chats
const demoChatMessages: Record<string, Message[]> = {}

export function useChat(matchId: string, userId: string) {
  const isDemo = matchId.startsWith('demo-match-')
  const [messages, setMessages] = useState<Message[]>(
    isDemo ? (demoChatMessages[matchId] ?? []) : []
  )
  const [loading, setLoading] = useState(!isDemo)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isDemo) {
      setMessages(demoChatMessages[matchId] ?? [])
      setLoading(false)
      return
    }
    if (!matchId) return
    let active = true

    const loadMessages = async () => {
      const { data, error: fetchError } = await supabase
        .from('messages').select('*')
        .eq('match_id', matchId).order('created_at', { ascending: true })
      if (!active) return
      if (fetchError) setError(fetchError.message)
      else setMessages(data ?? [])
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
    if (isDemo) {
      // Nachricht lokal speichern
      const newMsg: Message = {
        id: `demo-msg-${Date.now()}`,
        match_id: matchId,
        sender_id: userId,
        content,
        created_at: new Date().toISOString(),
      }
      demoChatMessages[matchId] = [...(demoChatMessages[matchId] ?? []), newMsg]
      setMessages(prev => [...prev, newMsg])

      // Demo-Antwort nach kurzer Verzögerung
      setTimeout(() => {
        const reply: Message = {
          id: `demo-reply-${Date.now()}`,
          match_id: matchId,
          sender_id: matchId.replace('demo-match-', ''),
          content: DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)],
          created_at: new Date().toISOString(),
        }
        demoChatMessages[matchId] = [...(demoChatMessages[matchId] ?? []), reply]
        setMessages(prev => [...prev, reply])
      }, 1000 + Math.random() * 1500)
      return
    }

    const { error: sendError } = await supabase
      .from('messages').insert({ match_id: matchId, sender_id: userId, content })
    if (sendError) throw new Error(sendError.message)
  }

  return { messages, loading, error, sendMessage }
}
