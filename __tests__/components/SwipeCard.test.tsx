import { render, screen } from '@testing-library/react-native'
import SwipeCard from '../../src/components/SwipeCard'

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, style }: any) => {
    const { View } = require('react-native')
    return <View style={style}>{children}</View>
  },
}))

const mockProfile = {
  id: '1', name: 'Jonas', age: 26, country: 'DE',
  bio: 'Adventure seeker', profile_image_url: null,
  travel_style: 'backpacker' as const, languages: ['DE', 'EN'],
  verified: false, is_premium: false, email: '', created_at: '',
  onboarding_complete: true, tagline: null, religion: null, photo_urls: null,
}

test('renders profile name', () => {
  render(<SwipeCard profile={mockProfile} destinations={[]} interests={[]}
    onSwipeLeft={jest.fn()} onSwipeRight={jest.fn()} />)
  expect(screen.getByText('Jonas, 26')).toBeTruthy()
})
