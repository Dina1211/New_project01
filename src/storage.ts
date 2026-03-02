// localStorage 读写封装
// 只统计完成的 25mins 番茄，5mins Try 不计入任何统计

export type Phase =
  | 'idle'
  | 'try'
  | 'tryComplete'
  | 'focus'
  | 'focusComplete'
  | 'shortBreakSelect'
  | 'shortBreak'
  | 'shortBreakComplete'
  | 'longBreak'
  | 'longBreakComplete'

const K = {
  total: 'pomo_total',
  daily: 'pomo_daily_map',
  group: 'pomo_group_count',
  lastTask: 'pomo_last_task',
  taskHistory: 'pomo_task_history',
  // 持久化 phase 恢复用
  phase: 'pomo_phase',
  targetEnd: 'pomo_target_end',
  taskName: 'pomo_task_name',
  breakChoice: 'pomo_break_choice',
  isPaused: 'pomo_is_paused',
  pausedRemaining: 'pomo_paused_remaining',
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── 统计 ──────────────────────────────────────────────

export function getTotal(): number {
  return parseInt(localStorage.getItem(K.total) ?? '0', 10)
}

export function incrementTotal(): void {
  localStorage.setItem(K.total, String(getTotal() + 1))
}

export function getTodayCount(): number {
  const map = getDailyMap()
  return map[todayKey()] ?? 0
}

export function incrementToday(): void {
  const map = getDailyMap()
  const key = todayKey()
  map[key] = (map[key] ?? 0) + 1
  localStorage.setItem(K.daily, JSON.stringify(map))
}

export function getDailyMap(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(K.daily) ?? '{}')
  } catch {
    return {}
  }
}

// ── 组进度 (0-4) ──────────────────────────────────────

export function getGroupCount(): number {
  return parseInt(localStorage.getItem(K.group) ?? '0', 10)
}

export function setGroupCount(n: number): void {
  localStorage.setItem(K.group, String(n))
}

// ── 今日任务历史 task → pomodoro count ───────────────

interface TaskHistoryStore {
  date: string
  tasks: Record<string, number>
}

export function getTodayTaskHistory(): Record<string, number> {
  try {
    const raw = localStorage.getItem(K.taskHistory)
    if (!raw) return {}
    const store: TaskHistoryStore = JSON.parse(raw)
    return store.date === todayKey() ? store.tasks : {}
  } catch {
    return {}
  }
}

export function incrementTaskHistory(taskName: string): void {
  const tasks = getTodayTaskHistory()
  tasks[taskName] = (tasks[taskName] ?? 0) + 1
  localStorage.setItem(K.taskHistory, JSON.stringify({ date: todayKey(), tasks }))
}

// ── 上次任务名 ────────────────────────────────────────

export function getLastTask(): string {
  return localStorage.getItem(K.lastTask) ?? ''
}

export function setLastTask(name: string): void {
  localStorage.setItem(K.lastTask, name)
}

// ── Phase 持久化（刷新恢复）────────────────────────────

export interface PersistedState {
  phase: Phase
  targetEnd: number | null   // ms timestamp
  taskName: string
  breakChoice: string
  isPaused: boolean
  pausedRemaining: number    // seconds remaining when paused
}

export function savePhaseState(s: PersistedState): void {
  localStorage.setItem(K.phase, s.phase)
  localStorage.setItem(K.targetEnd, s.targetEnd != null ? String(s.targetEnd) : '')
  localStorage.setItem(K.taskName, s.taskName)
  localStorage.setItem(K.breakChoice, s.breakChoice)
  localStorage.setItem(K.isPaused, s.isPaused ? '1' : '0')
  localStorage.setItem(K.pausedRemaining, String(s.pausedRemaining))
}

export function loadPhaseState(): PersistedState | null {
  const phase = localStorage.getItem(K.phase) as Phase | null
  if (!phase) return null
  const targetEndStr = localStorage.getItem(K.targetEnd)
  return {
    phase,
    targetEnd: targetEndStr ? parseInt(targetEndStr, 10) : null,
    taskName: localStorage.getItem(K.taskName) ?? '',
    breakChoice: localStorage.getItem(K.breakChoice) ?? '',
    isPaused: localStorage.getItem(K.isPaused) === '1',
    pausedRemaining: parseInt(localStorage.getItem(K.pausedRemaining) ?? '0', 10),
  }
}

export function clearPhaseState(): void {
  ;[K.phase, K.targetEnd, K.taskName, K.breakChoice, K.isPaused, K.pausedRemaining].forEach(
    (k) => localStorage.removeItem(k)
  )
}
