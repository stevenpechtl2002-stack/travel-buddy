import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface PollOption {
  id: string
  poll_id: string
  text: string
  voter_ids: string[]
}

export interface Poll {
  id: string
  group_id: string
  question: string
  created_by: string
  created_at: string
  options: PollOption[]
}

export function useGroupPolls(groupId: string, userId: string) {
  const [polls, setPolls] = useState<Poll[]>([])

  useEffect(() => {
    if (!groupId) return
    load()
  }, [groupId])

  const load = async () => {
    const { data: pollData } = await supabase
      .from('group_polls').select('*')
      .eq('group_id', groupId).order('created_at', { ascending: false })
    if (!pollData?.length) { setPolls([]); return }

    const { data: optData } = await supabase
      .from('group_poll_options').select('*')
      .in('poll_id', pollData.map(p => p.id))

    setPolls(pollData.map(p => ({
      ...p,
      options: (optData ?? []).filter(o => o.poll_id === p.id),
    })))
  }

  const createPoll = async (question: string, options: string[]) => {
    const { data: poll, error } = await supabase
      .from('group_polls').insert({ group_id: groupId, question, created_by: userId })
      .select().single()
    if (error || !poll) throw error
    const rows = options.map(text => ({ poll_id: poll.id, text, voter_ids: [] }))
    await supabase.from('group_poll_options').insert(rows)
    await load()
  }

  const vote = async (pollId: string, optionId: string) => {
    const poll = polls.find(p => p.id === pollId)
    if (!poll) return
    // Remove from all options first
    for (const opt of poll.options) {
      if (opt.voter_ids.includes(userId)) {
        await supabase.from('group_poll_options')
          .update({ voter_ids: opt.voter_ids.filter(id => id !== userId) }).eq('id', opt.id)
      }
    }
    // Add to chosen option
    const chosen = poll.options.find(o => o.id === optionId)
    if (!chosen) return
    await supabase.from('group_poll_options')
      .update({ voter_ids: [...chosen.voter_ids.filter(id => id !== userId), userId] }).eq('id', optionId)
    await load()
  }

  const deletePoll = async (id: string) => {
    await supabase.from('group_polls').delete().eq('id', id)
    setPolls(prev => prev.filter(p => p.id !== id))
  }

  return { polls, createPoll, vote, deletePoll }
}
