import { supabase } from '../lib/supabase'
import { SwipeDirection } from '../types'

export function useSwipe(userId: string) {
  const recordSwipe = async (targetId: string, direction: SwipeDirection) => {
    await supabase.from('swipes').insert({ swiper_id: userId, swiped_id: targetId, direction })

    if (direction === 'right') {
      // Check if target already swiped right on us
      const { data } = await supabase.from('swipes').select('*')
        .eq('swiper_id', targetId).eq('swiped_id', userId).eq('direction', 'right').single()

      if (data) {
        // Create match (ensure consistent ordering)
        const [a, b] = [userId, targetId].sort()
        await supabase.from('matches').insert({ user_a_id: a, user_b_id: b })
        return { isMatch: true }
      }
    }
    return { isMatch: false }
  }

  return { recordSwipe }
}
