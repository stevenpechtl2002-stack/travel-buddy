import { renderHook, act } from '@testing-library/react-native'
import { useAuth } from '../../src/hooks/useAuth'

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}))

test('starts with no session', async () => {
  const { result } = renderHook(() => useAuth())
  expect(result.current.session).toBeNull()
})
