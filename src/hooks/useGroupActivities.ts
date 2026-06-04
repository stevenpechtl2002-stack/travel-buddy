import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { GroupActivity } from '../types'

export function useGroupActivities(groupId: string, userId: string) {
  const [activities, setActivities] = useState<GroupActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!groupId) return
    load()
  }, [groupId])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('group_activities').select('*').eq('group_id', groupId).order('date', { ascending: true })
    setActivities(data ?? [])
    setLoading(false)
  }

  const addActivity = async (title: string, date: string | null, location: string | null) => {
    const { error } = await supabase.from('group_activities').insert({ group_id: groupId, title, date, location, created_by: userId })
    if (error) throw new Error(error.message)
    await load()
  }

  const deleteActivity = async (activityId: string) => {
    await supabase.from('group_activities').delete().eq('id', activityId)
    await load()
  }

  return { activities, loading, addActivity, deleteActivity }
}
