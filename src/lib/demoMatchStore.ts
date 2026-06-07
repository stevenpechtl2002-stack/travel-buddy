import AsyncStorage from '@react-native-async-storage/async-storage'
import { Match } from '../types'

const STORAGE_KEY = 'demo_matches_v1'
const listeners: Array<() => void> = []
let demoMatches: Match[] = []
let loaded = false

async function persist() {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(demoMatches))
}

export async function loadDemoMatches() {
  if (loaded) return
  loaded = true
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (raw) demoMatches = JSON.parse(raw)
  } catch {}
}

export function addDemoMatch(match: Match) {
  if (demoMatches.find(m => m.id === match.id)) return
  demoMatches.unshift(match)
  persist()
  listeners.forEach(fn => fn())
}

export function removeDemoMatch(matchId: string) {
  demoMatches = demoMatches.filter(m => m.id !== matchId)
  persist()
  listeners.forEach(fn => fn())
}

export function getDemoMatches(): Match[] {
  return [...demoMatches]
}

export function subscribeDemoMatches(fn: () => void): () => void {
  listeners.push(fn)
  return () => {
    const i = listeners.indexOf(fn)
    if (i >= 0) listeners.splice(i, 1)
  }
}
