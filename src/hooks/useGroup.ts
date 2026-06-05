import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Group, GroupMember, GroupRole, Profile } from '../types'

export interface GroupDetail extends Group {
  members: (GroupMember & { profile: Profile })[]
}

export function useGroup(groupId: string, userId: string) {
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!groupId) return
    loadGroup()
  }, [groupId])

  const loadGroup = async () => {
    setLoading(true)
    const { data: groupData } = await supabase.from('groups').select('*').eq('id', groupId).single()
    if (!groupData) { setLoading(false); return }

    const { data: memberRows } = await supabase.from('group_members').select('*').eq('group_id', groupId)
    const profileIds = (memberRows ?? []).map((m: any) => m.user_id)
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', profileIds)
    const profileMap = new Map<string, Profile>((profiles ?? []).map((p: Profile) => [p.id, p]))

    const members = (memberRows ?? []).map((m: GroupMember) => ({ ...m, profile: profileMap.get(m.user_id) as Profile }))
    setGroup({ ...groupData, members })
    setLoading(false)
  }

  const updatePlan = async (fields: Partial<Pick<Group, 'destination' | 'date_from' | 'date_to' | 'name' | 'description' | 'notes'>>) => {
    await supabase.from('groups').update(fields).eq('id', groupId)
    await loadGroup()
  }

  const updateMemberRole = async (memberId: string, role: GroupRole) => {
    await supabase.from('group_members').update({ role }).eq('group_id', groupId).eq('user_id', memberId)
    await loadGroup()
  }

  const removeMember = async (memberId: string) => {
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', memberId)
    await loadGroup()
  }

  const inviteMember = async (invitedUserId: string) => {
    await supabase.from('group_members').insert({ group_id: groupId, user_id: invitedUserId, role: 'member', status: 'invited' })
    await loadGroup()
  }

  const myRole = group?.members.find(m => m.user_id === userId)?.role ?? 'member'
  const canEdit = myRole === 'admin' || myRole === 'moderator'

  return { group, loading, myRole, canEdit, refresh: loadGroup, updatePlan, updateMemberRole, removeMember, inviteMember }
}
