import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Match, Profile } from '../types'

export function useMatches(userId: string) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    loadMatches()
  }, [userId])

  const loadMatches = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('matches')
      .select('*')
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (!data) { setLoading(false); return }

    const enriched: Match[] = (await Promise.all(
      data.map(async (match: { id: string; user_a_id: string; user_b_id: string; created_at: string }) => {
        const otherId = match.user_a_id === userId ? match.user_b_id : match.user_a_id
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', otherId).single()
        if (!profile) return null
        return { ...match, other_user: profile as Profile }
      })
    )).filter((m): m is Match => m !== null)

    setMatches(enriched)
    setLoading(false)
  }

  return { matches, loading }
}
