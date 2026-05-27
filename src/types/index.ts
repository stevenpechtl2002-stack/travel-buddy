export type TravelStyle = 'backpacker' | 'luxury' | 'city' | 'adventure' | 'beach'
export type SwipeDirection = 'left' | 'right'

export interface Profile {
  id: string
  email: string
  name: string
  age: number
  country: string
  bio: string
  profile_image_url: string | null
  travel_style: TravelStyle | null
  languages: string[]
  verified: boolean
  is_premium: boolean
  onboarding_complete: boolean
  created_at: string
}

export interface TravelDestination {
  id: string
  user_id: string
  country: string
  city: string | null
  date_from: string | null
  date_to: string | null
}

export interface UserInterest {
  user_id: string
  interest: string
}

export interface Match {
  id: string
  user_a_id: string
  user_b_id: string
  created_at: string
  other_user: Profile
}

export interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
}
