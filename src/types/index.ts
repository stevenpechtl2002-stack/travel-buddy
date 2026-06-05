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

export type GroupRole = 'admin' | 'moderator' | 'member'
export type GroupMemberStatus = 'invited' | 'active'

export interface Group {
  id: string
  name: string
  description: string | null
  destination: string | null
  date_from: string | null
  date_to: string | null
  notes: string | null
  is_public: boolean
  created_by: string
  created_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: GroupRole
  status: GroupMemberStatus
  joined_at: string | null
  created_at: string
}

export interface GroupMessage {
  id: string
  group_id: string
  sender_id: string
  content: string
  created_at: string
}

export interface GroupActivity {
  id: string
  group_id: string
  title: string
  date: string | null
  location: string | null
  created_by: string
  created_at: string
}
