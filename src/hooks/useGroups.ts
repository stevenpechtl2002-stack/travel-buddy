import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Group, GroupRole, GroupMemberStatus } from '../types'

export interface GroupWithRole extends Group {
  myRole: GroupRole
  myStatus: GroupMemberStatus
  memberCount: number
}

export function useGroups(userId: string) {
  const [groups, setGroups] = useState<GroupWithRole[]>([])
  const [invitations, setInvitations] = useState<GroupWithRole[]>([])
  const [publicGroups, setPublicGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    loadGroups()
    loadPublicGroups()
  }, [userId])

  const loadGroups = async () => {
    setLoading(true)
    const { data: memberRows } = await supabase
      .from('group_members').select('group_id, role, status').eq('user_id', userId)

    if (!memberRows?.length) { setLoading(false); return }

    const groupIds = memberRows.map((m: any) => m.group_id)
    const { data: groupData } = await supabase.from('groups').select('*').in('id', groupIds)
    const { data: allMembers } = await supabase.from('group_members').select('group_id').in('group_id', groupIds).eq('status', 'active')

    const countMap = new Map<string, number>()
    ;(allMembers ?? []).forEach((m: any) => countMap.set(m.group_id, (countMap.get(m.group_id) ?? 0) + 1))

    const enriched: GroupWithRole[] = (groupData ?? []).map((g: Group) => {
      const mem = memberRows.find((m: any) => m.group_id === g.id)
      return { ...g, myRole: mem?.role ?? 'member', myStatus: mem?.status ?? 'invited', memberCount: countMap.get(g.id) ?? 0 }
    })

    setGroups(enriched.filter(g => g.myStatus === 'active'))
    setInvitations(enriched.filter(g => g.myStatus === 'invited'))
    setLoading(false)
  }

  const loadPublicGroups = async () => {
    const { data } = await supabase.from('groups').select('*').eq('is_public', true).order('created_at', { ascending: false }).limit(50)
    setPublicGroups(data ?? [])
  }

  const acceptInvitation = async (groupId: string) => {
    await supabase.from('group_members').update({ status: 'active', joined_at: new Date().toISOString() }).eq('group_id', groupId).eq('user_id', userId)
    await loadGroups()
  }

  const declineInvitation = async (groupId: string) => {
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId)
    await loadGroups()
  }

  const joinPublicGroup = async (groupId: string) => {
    await supabase.from('group_members').insert({ group_id: groupId, user_id: userId, role: 'member', status: 'active', joined_at: new Date().toISOString() })
    await loadGroups()
  }

  return { groups, invitations, publicGroups, loading, refresh: loadGroups, acceptInvitation, declineInvitation, joinPublicGroup }
}
