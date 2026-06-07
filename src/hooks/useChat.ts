import AsyncStorage from '@react-native-async-storage/async-storage'
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

function chatKey(matchId: string) {
  return `demo_chat_${matchId}`
}

async function loadDemoChatMessages(matchId: string): Promise<Message[]> {
  try {
    const raw = await AsyncStorage.getItem(chatKey(matchId))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

async function saveDemoChatMessages(matchId: string, msgs: Message[]) {
  try {
    await AsyncStorage.setItem(chatKey(matchId), JSON.stringify(msgs))
  } catch {}
}

export function useChat(matchId: string, userId: string) {
  const isDemo = matchId.startsWith('demo-match-')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isDemo) {
      loadDemoChatMessages(matchId).then(msgs => {
        setMessages(msgs)
        setLoading(false)
      })
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
      const newMsg: Message = {
        id: `demo-msg-${Date.now()}`,
        match_id: matchId,
        sender_id: userId,
        content,
        created_at: new Date().toISOString(),
      }
      const updated = [...messages, newMsg]
      setMessages(updated)
      saveDemoChatMessages(matchId, updated)

      setTimeout(async () => {
        const reply: Message = {
          id: `demo-reply-${Date.now()}`,
          match_id: matchId,
          sender_id: matchId.replace('demo-match-', ''),
          content: DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)],
          created_at: new Date().toISOString(),
        }
        setMessages(prev => {
          const next = [...prev, reply]
          saveDemoChatMessages(matchId, next)
          return next
        })
      }, 1000 + Math.random() * 1500)
      return
    }

    const { error: sendError } = await supabase
      .from('messages').insert({ match_id: matchId, sender_id: userId, content })
    if (sendError) throw new Error(sendError.message)
  }

  return { messages, loading, error, sendMessage }
}
