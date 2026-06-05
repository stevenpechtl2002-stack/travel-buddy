import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { GroupMessage } from '../types'

export function useGroupMessages(groupId: string, userId: string) {
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!groupId) return
    let active = true

    supabase.from('group_messages').select('*').eq('group_id', groupId).order('created_at', { ascending: true })
      .then(({ data }) => { if (active) { setMessages(data ?? []); setLoading(false) } })

    const channel = supabase.channel(`group:${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` },
        (payload: any) => { if (active) setMessages(prev => [...prev, payload.new]) })
      .subscribe()

    return () => { active = false; supabase.removeChannel(channel) }
  }, [groupId])

  const sendMessage = async (content: string) => {
    const optimistic: GroupMessage = {
      id: `optimistic-${Date.now()}`,
      group_id: groupId,
      sender_id: userId,
      content,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    const { error } = await supabase.from('group_messages').insert({ group_id: groupId, sender_id: userId, content })
    if (error) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      throw new Error(error.message)
    }
  }

  return { messages, loading, sendMessage }
}
