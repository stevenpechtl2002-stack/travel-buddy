jest.mock('../../src/lib/supabase', () => {
  const mockUnsubscribe = jest.fn()
  const mockSubscribe = jest.fn().mockReturnValue({ unsubscribe: mockUnsubscribe })
  const mockOn = jest.fn().mockReturnValue({ subscribe: mockSubscribe })
  const mockChannel = jest.fn().mockReturnValue({ on: mockOn })
  const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null })
  const mockEq = jest.fn().mockReturnValue({ order: mockOrder })
  const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
  const mockRemoveChannel = jest.fn()

  return {
    supabase: {
      from: jest.fn(() => ({ select: mockSelect })),
      channel: mockChannel,
      removeChannel: mockRemoveChannel,
    },
  }
})

import { renderHook } from '@testing-library/react-native'
import { useChat } from '../../src/hooks/useChat'

test('initializes with empty messages', () => {
  const { result } = renderHook(() => useChat('match-1', 'user-1'))
  expect(result.current.messages).toEqual([])
})
