import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface ChecklistItem {
  id: string
  group_id: string
  title: string
  is_done: boolean
  created_by: string
  created_at: string
}

export function useGroupChecklist(groupId: string, userId: string) {
  const [items, setItems] = useState<ChecklistItem[]>([])

  useEffect(() => {
    if (!groupId) return
    load()
  }, [groupId])

  const load = async () => {
    const { data } = await supabase
      .from('group_checklist').select('*')
      .eq('group_id', groupId).order('created_at')
    setItems(data ?? [])
  }

  const addItem = async (title: string) => {
    const { error } = await supabase.from('group_checklist')
      .insert({ group_id: groupId, title, created_by: userId })
    if (error) throw error
    await load()
  }

  const addTemplate = async (titles: string[]) => {
    const rows = titles.map(title => ({ group_id: groupId, title, created_by: userId }))
    await supabase.from('group_checklist').insert(rows)
    await load()
  }

  const toggleItem = async (id: string, isDone: boolean) => {
    await supabase.from('group_checklist').update({ is_done: !isDone }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_done: !isDone } : i))
  }

  const deleteItem = async (id: string) => {
    await supabase.from('group_checklist').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const doneCount = items.filter(i => i.is_done).length

  return { items, addItem, addTemplate, toggleItem, deleteItem, doneCount }
}
