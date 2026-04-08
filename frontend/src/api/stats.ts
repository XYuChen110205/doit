import { get } from './client'
import type { StatsData } from '../types'

export async function getStats(type: 'week' | 'month', date: string): Promise<StatsData> {
  return get<StatsData>('/api/stats', { type, date })
}
