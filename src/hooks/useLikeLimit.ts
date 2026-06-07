import AsyncStorage from '@react-native-async-storage/async-storage'

const DAILY_LIMIT = 20
const KEY = 'like_limit_v1'

interface LimitData {
  date: string
  count: number
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export async function getLikesRemaining(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    if (!raw) return DAILY_LIMIT
    const data: LimitData = JSON.parse(raw)
    if (data.date !== today()) return DAILY_LIMIT
    return Math.max(0, DAILY_LIMIT - data.count)
  } catch { return DAILY_LIMIT }
}

export async function recordLike(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    let data: LimitData = { date: today(), count: 0 }
    if (raw) {
      const parsed: LimitData = JSON.parse(raw)
      data = parsed.date === today() ? parsed : { date: today(), count: 0 }
    }
    data.count += 1
    await AsyncStorage.setItem(KEY, JSON.stringify(data))
    return Math.max(0, DAILY_LIMIT - data.count)
  } catch { return DAILY_LIMIT }
}

export async function resetLikes() {
  await AsyncStorage.removeItem(KEY)
}

export { DAILY_LIMIT }
