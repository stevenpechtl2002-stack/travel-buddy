import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Match, Profile } from '../types'
import { getDemoMatches, subscribeDemoMatches } from '../lib/demoMatchStore'

const DEMO_MATCHES: Match[] = [
  {
    id: 'match-1',
    user_a_id: 'me',
    user_b_id: 'demo-1',
    created_at: new Date().toISOString(),
    other_user: {
      id: 'demo-1', name: 'Laura', age: 26, email: '', country: 'Thailand',
      bio: 'Solo-Reisende auf der Suche nach Abenteuern 🌏',
      profile_image_url: null, travel_style: 'adventure',
      languages: [], verified: false, is_premium: false,
      onboarding_complete: true, created_at: '',
    },
  },
  {
    id: 'match-2',
    user_a_id: 'me',
    user_b_id: 'demo-2',
    created_at: new Date().toISOString(),
    other_user: {
      id: 'demo-2', name: 'Max', age: 29, email: '', country: 'Japan',
      bio: 'Backpacker & Kaffeeliebhaber ☕',
      profile_image_url: null, travel_style: 'backpacker',
      languages: [], verified: false, is_premium: false,
      onboarding_complete: true, created_at: '',
    },
  },
]

export function useMatches(userId: string) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setMatches(DEMO_MATCHES)
      setLoading(false)
      return
    }
    loadMatches()

    // Live-Update wenn ein Demo-Match hinzukommt
    const unsubscribe = subscribeDemoMatches(() => {
      setMatches(prev => {
        const demo = getDemoMatches()
        const existing = prev.filter(m => !m.id.startsWith('demo-match-'))
        return [...demo, ...existing]
      })
    })
    return unsubscribe
  }, [userId])

  const loadMatches = async () => {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('matches')
      .select('*')
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    if (!data) { setLoading(false); return }

    const profileIds = data.map((match: { user_a_id: string; user_b_id: string }) =>
      match.user_a_id === userId ? match.user_b_id : match.user_a_id
    )

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .in('id', profileIds)

    const profileMap = new Map<string, Profile>((profilesData ?? []).map((p: Profile) => [p.id, p]))

    const enriched: Match[] = data
      .map((match: { id: string; user_a_id: string; user_b_id: string; created_at: string }) => {
        const otherId = match.user_a_id === userId ? match.user_b_id : match.user_a_id
        const profile = profileMap.get(otherId)
        if (!profile) return null
        return { ...match, other_user: profile }
      })
      .filter((m: Match | null): m is Match => m !== null)

    setMatches([...getDemoMatches(), ...enriched])
    setLoading(false)
  }

  return { matches, loading, error, refresh: loadMatches }
}
