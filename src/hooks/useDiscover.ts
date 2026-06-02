import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Profile, TravelDestination, UserInterest } from '../types'

interface DiscoverProfile {
  profile: Profile
  destinations: TravelDestination[]
  interests: UserInterest[]
}

export function useDiscover(userId: string) {
  const [candidates, setCandidates] = useState<DiscoverProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    loadCandidates()
  }, [userId])

  const loadCandidates = async () => {
    setLoading(true)
    // Get IDs already swiped
    const { data: swiped } = await supabase
      .from('swipes').select('swiped_id').eq('swiper_id', userId)
    const swipedIds = (swiped ?? []).map((s: { swiped_id: string }) => s.swiped_id)
    swipedIds.push(userId) // exclude self

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('onboarding_complete', true)
      .not('id', 'in', `(${swipedIds.join(',')})`)
      .limit(20)

    if (!profiles) { setLoading(false); return }

    const enriched: DiscoverProfile[] = await Promise.all(
      profiles.map(async (profile: Profile) => {
        const [{ data: destinations }, { data: interests }] = await Promise.all([
          supabase.from('travel_destinations').select('*').eq('user_id', profile.id),
          supabase.from('user_interests').select('*').eq('user_id', profile.id),
        ])
        return { profile, destinations: destinations ?? [], interests: interests ?? [] }
      })
    )
    setCandidates(enriched)
    setLoading(false)
  }

  const removeTop = () => setCandidates(prev => prev.slice(1))

  return { candidates, loading, reload: loadCandidates, removeTop }
}
