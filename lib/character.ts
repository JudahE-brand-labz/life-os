export type CharacterState = 'idle' | 'working' | 'celebrating' | 'concerned' | 'sleeping'

export function deriveCharacterState(
  habitsDone: number,
  habitsTotal: number,
  streakAtRisk: boolean,
  hour: number
): CharacterState {
  if (hour >= 21) return 'sleeping'
  if (habitsDone === habitsTotal && habitsTotal > 0) return 'celebrating'
  if (streakAtRisk) return 'concerned'
  if (hour >= 9 && hour < 18) return 'working'
  return 'idle'
}
