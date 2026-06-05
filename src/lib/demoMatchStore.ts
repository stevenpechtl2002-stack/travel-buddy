import { Match } from '../types'

// In-memory store for demo matches created during the session
const listeners: Array<() => void> = []
const demoMatches: Match[] = []

export function addDemoMatch(match: Match) {
  if (demoMatches.find(m => m.id === match.id)) return
  demoMatches.unshift(match)
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
