import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Profile, TravelDestination, UserInterest } from '../types'

interface DiscoverProfile {
  profile: Profile
  destinations: TravelDestination[]
  interests: UserInterest[]
}

const DEMO_CANDIDATES: DiscoverProfile[] = [
  {
    profile: {
      id: 'demo-1', name: 'Laura', age: 26, email: '', country: 'Deutschland',
      bio: 'Solo-Reisende auf der Suche nach Abenteuern 🌏',
      profile_image_url: 'https://picsum.photos/seed/laura/400/600',
      travel_style: 'adventure', languages: [], verified: false, is_premium: false,
      onboarding_complete: true, created_at: '',
    },
    destinations: [
      { id: 'd1', user_id: 'demo-1', country: 'Thailand', city: 'Bangkok', date_from: null, date_to: null },
      { id: 'd2', user_id: 'demo-1', country: 'Indonesien', city: 'Bali', date_from: null, date_to: null },
    ],
    interests: [{ user_id: 'demo-1', interest: 'Tauchen' }, { user_id: 'demo-1', interest: 'Fotografie' }],
  },
  {
    profile: {
      id: 'demo-2', name: 'Max', age: 29, email: '', country: 'Deutschland',
      bio: 'Backpacker & Kaffeeliebhaber ☕ Auf der Suche nach dem nächsten Abenteuer.',
      profile_image_url: 'https://picsum.photos/seed/max/400/600',
      travel_style: 'backpacker', languages: [], verified: false, is_premium: false,
      onboarding_complete: true, created_at: '',
    },
    destinations: [
      { id: 'd3', user_id: 'demo-2', country: 'Japan', city: 'Tokio', date_from: null, date_to: null },
      { id: 'd4', user_id: 'demo-2', country: 'Südkorea', city: 'Seoul', date_from: null, date_to: null },
    ],
    interests: [{ user_id: 'demo-2', interest: 'Kochen' }, { user_id: 'demo-2', interest: 'Wandern' }],
  },
  {
    profile: {
      id: 'demo-3', name: 'Sofia', age: 24, email: '', country: 'Spanien',
      bio: 'Digital Nomad 💻 | Strandliebhaberin | Immer auf Achse',
      profile_image_url: 'https://picsum.photos/seed/sofia/400/600',
      travel_style: 'beach', languages: [], verified: false, is_premium: false,
      onboarding_complete: true, created_at: '',
    },
    destinations: [
      { id: 'd5', user_id: 'demo-3', country: 'Portugal', city: 'Lissabon', date_from: null, date_to: null },
      { id: 'd6', user_id: 'demo-3', country: 'Marokko', city: 'Marrakesch', date_from: null, date_to: null },
    ],
    interests: [{ user_id: 'demo-3', interest: 'Surfen' }, { user_id: 'demo-3', interest: 'Yoga' }],
  },
  {
    profile: {
      id: 'demo-4', name: 'Jonas', age: 31, email: '', country: 'Schweiz',
      bio: 'Bergsteiger & Naturliebhaber 🏔️ Die Berge rufen immer.',
      profile_image_url: 'https://picsum.photos/seed/jonas/400/600',
      travel_style: 'adventure', languages: [], verified: false, is_premium: false,
      onboarding_complete: true, created_at: '',
    },
    destinations: [
      { id: 'd7', user_id: 'demo-4', country: 'Nepal', city: 'Kathmandu', date_from: null, date_to: null },
      { id: 'd8', user_id: 'demo-4', country: 'Neuseeland', city: 'Queenstown', date_from: null, date_to: null },
    ],
    interests: [{ user_id: 'demo-4', interest: 'Klettern' }, { user_id: 'demo-4', interest: 'Camping' }],
  },
  {
    profile: {
      id: 'demo-5', name: 'Mia', age: 27, email: '', country: 'Österreich',
      bio: 'Foodie & Kulturreisende 🍜 Jede Stadt durch ihren Geschmack entdecken.',
      profile_image_url: 'https://picsum.photos/seed/mia/400/600',
      travel_style: 'city', languages: [], verified: false, is_premium: false,
      onboarding_complete: true, created_at: '',
    },
    destinations: [
      { id: 'd9', user_id: 'demo-5', country: 'Vietnam', city: 'Hanoi', date_from: null, date_to: null },
      { id: 'd10', user_id: 'demo-5', country: 'Mexiko', city: 'Oaxaca', date_from: null, date_to: null },
    ],
    interests: [{ user_id: 'demo-5', interest: 'Street Food' }, { user_id: 'demo-5', interest: 'Museen' }],
  },
  {
    profile: {
      id: 'demo-6', name: 'Luca', age: 28, email: '', country: 'Italien',
      bio: 'Fotograf & Geschichtenerzähler 📷 Die Welt durch die Linse.',
      profile_image_url: 'https://picsum.photos/seed/luca/400/600',
      travel_style: 'city', languages: [], verified: false, is_premium: false,
      onboarding_complete: true, created_at: '',
    },
    destinations: [
      { id: 'd11', user_id: 'demo-6', country: 'Kuba', city: 'Havanna', date_from: null, date_to: null },
      { id: 'd12', user_id: 'demo-6', country: 'Äthiopien', city: 'Addis Abeba', date_from: null, date_to: null },
    ],
    interests: [{ user_id: 'demo-6', interest: 'Fotografie' }, { user_id: 'demo-6', interest: 'Architektur' }],
  },
  {
    profile: {
      id: 'demo-7', name: 'Emma', age: 23, email: '', country: 'Frankreich',
      bio: 'Studentin auf Weltreise 🎒 Ein Jahr, alle Kontinente.',
      profile_image_url: 'https://picsum.photos/seed/emma/400/600',
      travel_style: 'backpacker', languages: [], verified: false, is_premium: false,
      onboarding_complete: true, created_at: '',
    },
    destinations: [
      { id: 'd13', user_id: 'demo-7', country: 'Australien', city: 'Melbourne', date_from: null, date_to: null },
      { id: 'd14', user_id: 'demo-7', country: 'Kolumbien', city: 'Medellín', date_from: null, date_to: null },
    ],
    interests: [{ user_id: 'demo-7', interest: 'Trekking' }, { user_id: 'demo-7', interest: 'Freiwilligenarbeit' }],
  },
  {
    profile: {
      id: 'demo-8', name: 'Noah', age: 33, email: '', country: 'USA',
      bio: 'Van life enthusiast 🚐 Die Straße ist mein Zuhause.',
      profile_image_url: 'https://picsum.photos/seed/noah/400/600',
      travel_style: 'adventure', languages: [], verified: false, is_premium: false,
      onboarding_complete: true, created_at: '',
    },
    destinations: [
      { id: 'd15', user_id: 'demo-8', country: 'Island', city: 'Reykjavík', date_from: null, date_to: null },
      { id: 'd16', user_id: 'demo-8', country: 'Kanada', city: 'Vancouver', date_from: null, date_to: null },
    ],
    interests: [{ user_id: 'demo-8', interest: 'Camping' }, { user_id: 'demo-8', interest: 'Motorradfahren' }],
  },
  {
    profile: {
      id: 'demo-9', name: 'Yuki', age: 25, email: '', country: 'Japan',
      bio: 'Manga-Fan & Weltenbummlerin 🌸 Kultur verbindet uns alle.',
      profile_image_url: 'https://picsum.photos/seed/yuki/400/600',
      travel_style: 'city', languages: [], verified: false, is_premium: false,
      onboarding_complete: true, created_at: '',
    },
    destinations: [
      { id: 'd17', user_id: 'demo-9', country: 'Südafrika', city: 'Kapstadt', date_from: null, date_to: null },
      { id: 'd18', user_id: 'demo-9', country: 'Brasilien', city: 'Rio de Janeiro', date_from: null, date_to: null },
    ],
    interests: [{ user_id: 'demo-9', interest: 'Manga & Anime' }, { user_id: 'demo-9', interest: 'Tanzen' }],
  },
  {
    profile: {
      id: 'demo-10', name: 'Ali', age: 30, email: '', country: 'Türkei',
      bio: 'Weltreisender & Sprachliebhaber 🗣️ Spreche 5 Sprachen fließend.',
      profile_image_url: 'https://randomuser.me/api/portraits/men/6.jpg',
      travel_style: 'backpacker', languages: [], verified: false, is_premium: false,
      onboarding_complete: true, created_at: '',
    },
    destinations: [
      { id: 'd19', user_id: 'demo-10', country: 'Georgien', city: 'Tiflis', date_from: null, date_to: null },
      { id: 'd20', user_id: 'demo-10', country: 'Iran', city: 'Isfahan', date_from: null, date_to: null },
    ],
    interests: [{ user_id: 'demo-10', interest: 'Sprachen lernen' }, { user_id: 'demo-10', interest: 'Geschichte' }],
  },
  {
    profile: {
      id: 'demo-11', name: 'Chloe', age: 28, email: '', country: 'Kanada',
      bio: 'Luxus-Backpackerin 🥂 Reisen muss nicht teuer sein, aber manchmal darf es das.',
      profile_image_url: 'https://randomuser.me/api/portraits/women/39.jpg',
      travel_style: 'luxury', languages: [], verified: false, is_premium: true,
      onboarding_complete: true, created_at: '',
    },
    destinations: [
      { id: 'd21', user_id: 'demo-11', country: 'Malediven', city: null, date_from: null, date_to: null },
      { id: 'd22', user_id: 'demo-11', country: 'Griechenland', city: 'Santorini', date_from: null, date_to: null },
    ],
    interests: [{ user_id: 'demo-11', interest: 'Wellness & Spa' }, { user_id: 'demo-11', interest: 'Kulinarik' }],
  },
  {
    profile: {
      id: 'demo-12', name: 'Finn', age: 26, email: '', country: 'Norwegen',
      bio: 'Nordlichter-Jäger & Winterkamper ❄️ Kälte ist kein Problem.',
      profile_image_url: 'https://randomuser.me/api/portraits/men/3.jpg',
      travel_style: 'adventure', languages: [], verified: false, is_premium: false,
      onboarding_complete: true, created_at: '',
    },
    destinations: [
      { id: 'd23', user_id: 'demo-12', country: 'Finnland', city: 'Lappland', date_from: null, date_to: null },
      { id: 'd24', user_id: 'demo-12', country: 'Grönland', city: null, date_from: null, date_to: null },
    ],
    interests: [{ user_id: 'demo-12', interest: 'Ski' }, { user_id: 'demo-12', interest: 'Nordlichter' }],
  },
  {
    profile: {
      id: 'demo-13', name: 'Amara', age: 27, email: '', country: 'Nigeria',
      bio: 'Afrikareisende & Fashion-Bloggerin ✨ Afrika zeigen wie es wirklich ist.',
      profile_image_url: 'https://randomuser.me/api/portraits/women/56.jpg',
      travel_style: 'city', languages: [], verified: true, is_premium: true,
      onboarding_complete: true, created_at: '',
    },
    destinations: [
      { id: 'd25', user_id: 'demo-13', country: 'Senegal', city: 'Dakar', date_from: null, date_to: null },
      { id: 'd26', user_id: 'demo-13', country: 'Tansania', city: 'Sansibar', date_from: null, date_to: null },
    ],
    interests: [{ user_id: 'demo-13', interest: 'Mode' }, { user_id: 'demo-13', interest: 'Content Creation' }],
  },
  {
    profile: {
      id: 'demo-14', name: 'Carlos', age: 32, email: '', country: 'Mexiko',
      bio: 'Salsa-Tänzer & Hobbyköch 🌮 Unterwegs zwischen Strand und Berge.',
      profile_image_url: null, travel_style: 'adventure', languages: [], verified: false, is_premium: false,
      onboarding_complete: true, created_at: '',
    },
    destinations: [
      { id: 'd27', user_id: 'demo-14', country: 'Kolumbien', city: 'Cartagena', date_from: null, date_to: null },
      { id: 'd28', user_id: 'demo-14', country: 'Peru', city: 'Cusco', date_from: null, date_to: null },
    ],
    interests: [{ user_id: 'demo-14', interest: 'Tanzen' }, { user_id: 'demo-14', interest: 'Kochen' }],
  },
  {
    profile: {
      id: 'demo-15', name: 'Anna', age: 22, email: '', country: 'Polen',
      bio: 'Studentin & Backpackerin 🎒 Europa zuerst, dann die Welt!',
      profile_image_url: null, travel_style: 'backpacker', languages: [], verified: false, is_premium: false,
      onboarding_complete: true, created_at: '',
    },
    destinations: [
      { id: 'd29', user_id: 'demo-15', country: 'Griechenland', city: 'Athen', date_from: null, date_to: null },
      { id: 'd30', user_id: 'demo-15', country: 'Kroatien', city: 'Dubrovnik', date_from: null, date_to: null },
    ],
    interests: [{ user_id: 'demo-15', interest: 'Lesen' }, { user_id: 'demo-15', interest: 'Schwimmen' }],
  },
  {
    profile: {
      id: 'demo-16', name: 'Ben', age: 25, email: '', country: 'Australien',
      bio: 'Surf & Chill 🏄 Die Wellen rufen mich überall hin.',
      profile_image_url: null, travel_style: 'beach', languages: [], verified: false, is_premium: false,
      onboarding_complete: true, created_at: '',
    },
    destinations: [
      { id: 'd31', user_id: 'demo-16', country: 'Indonesien', city: 'Lombok', date_from: null, date_to: null },
      { id: 'd32', user_id: 'demo-16', country: 'Hawaii', city: 'Honolulu', date_from: null, date_to: null },
    ],
    interests: [{ user_id: 'demo-16', interest: 'Surfen' }, { user_id: 'demo-16', interest: 'Tauchen' }],
  },
  {
    profile: {
      id: 'demo-17', name: 'Priya', age: 29, email: '', country: 'Indien',
      bio: 'Yoga-Lehrerin & Weltreisende 🧘 Spirituelle Orte & bunte Kulturen.',
      profile_image_url: null, travel_style: 'city', languages: [], verified: false, is_premium: false,
      onboarding_complete: true, created_at: '',
    },
    destinations: [
      { id: 'd33', user_id: 'demo-17', country: 'Nepal', city: 'Pokhara', date_from: null, date_to: null },
      { id: 'd34', user_id: 'demo-17', country: 'Sri Lanka', city: 'Colombo', date_from: null, date_to: null },
    ],
    interests: [{ user_id: 'demo-17', interest: 'Yoga' }, { user_id: 'demo-17', interest: 'Meditation' }],
  },
]

export function useDiscover(userId: string) {
  const [candidates, setCandidates] = useState<DiscoverProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCandidates = useCallback(async () => {
    if (!userId) {
      setCandidates(DEMO_CANDIDATES)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    const { data: swiped } = await supabase
      .from('swipes').select('swiped_id').eq('swiper_id', userId)
    const swipedIds = (swiped ?? []).map((s: { swiped_id: string }) => s.swiped_id)
    swipedIds.push(userId)

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('onboarding_complete', true)
      .not('id', 'in', `(${swipedIds.map(id => `"${id}"`).join(',')})`)
      .limit(20)

    if (profilesError) {
      setError(profilesError.message)
      setLoading(false)
      return
    }

    const enriched: DiscoverProfile[] = profiles
      ? await Promise.all(
          profiles.map(async (profile: Profile) => {
            const [{ data: destinations }, { data: interests }] = await Promise.all([
              supabase.from('travel_destinations').select('*').eq('user_id', profile.id),
              supabase.from('user_interests').select('*').eq('user_id', profile.id),
            ])
            return { profile, destinations: destinations ?? [], interests: interests ?? [] }
          })
        )
      : []

    // Always include demo profiles so there's always someone to swipe on
    const alreadySwiped = new Set(swipedIds)
    const filteredDemo = DEMO_CANDIDATES.filter(d => !alreadySwiped.has(d.profile.id))
    setCandidates([...enriched, ...filteredDemo])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadCandidates()
  }, [loadCandidates])

  const removeTop = () => setCandidates(prev => prev.slice(1))

  return { candidates, loading, error, reload: loadCandidates, removeTop }
}
