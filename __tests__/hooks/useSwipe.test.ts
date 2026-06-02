import { renderHook, act } from '@testing-library/react-native'

const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null })
const mockSelect = jest.fn().mockReturnValue({
  eq: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null })
      })
    })
  })
})

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn((table: string) => {
      if (table === 'swipes') return { insert: mockInsert, select: mockSelect }
      if (table === 'matches') return { insert: mockInsert }
      return {}
    }),
  },
}))

import { useSwipe } from '../../src/hooks/useSwipe'

test('recordSwipe calls supabase insert', async () => {
  const { result } = renderHook(() => useSwipe('user-a'))
  await act(async () => {
    await result.current.recordSwipe('user-b', 'right')
  })
  expect(mockInsert).toHaveBeenCalled()
})
