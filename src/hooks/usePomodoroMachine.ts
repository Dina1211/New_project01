import { useState, useEffect, useCallback, useRef } from 'react'
import type { Phase } from '../storage'
import * as storage from '../storage'

// ── Dev 模式：URL 参数 ?dev=1 启用极短时长 ────────────
const isDev = new URLSearchParams(window.location.search).get('dev') === '1'

export const DURATIONS: Record<string, number> = {
  focus: isDev ? 10 : 25 * 60,
  shortBreak: isDev ? 5 : 5 * 60,
  longBreak: isDev ? 8 : 30 * 60,
  try: isDev ? 5 : 5 * 60,
}

export interface MachineState {
  phase: Phase
  taskName: string       // 当前任务名
  breakChoice: string    // 当前休息方式
  timeLeft: number       // 剩余秒数（计时阶段有效）
  isPaused: boolean
  groupCount: number     // 当前组已完成番茄数 0-4
  todayCount: number     // 今日完成番茄数
  totalCount: number     // 累计完成番茄数
}

export interface MachineActions {
  startTry: () => void
  startFocus: (task: string) => void
  pauseResume: () => void
  abandonFocus: () => void
  completeTryThenFocus: (task: string) => void  // try 结束后继续 25mins
  exitToIdle: () => void
  goToShortBreakSelect: () => void              // focusComplete → shortBreakSelect
  selectBreak: (choice: string) => void         // shortBreakSelect → shortBreak
  startNextFocus: (task: string) => void         // 短休结束后开始下一个
  startLongBreak: () => void                     // focusComplete → longBreak
  skipLongBreak: () => void                      // 跳过长休
  startNewRound: () => void                      // 长休结束后开始新一轮
  acknowledgeShortBreakDone: (task: string) => void
}

// ── 初始状态（从 localStorage 恢复或新建）────────────
function buildInitialState(): MachineState {
  const persisted = storage.loadPhaseState()
  const group = storage.getGroupCount()
  const today = storage.getTodayCount()
  const total = storage.getTotal()

  const base: MachineState = {
    phase: 'idle',
    taskName: storage.getLastTask(),
    breakChoice: '',
    timeLeft: 0,
    isPaused: false,
    groupCount: group,
    todayCount: today,
    totalCount: total,
  }

  if (!persisted) return base

  // 恢复计时阶段：重新计算剩余时间
  const timedPhases: Phase[] = ['try', 'focus', 'shortBreak', 'longBreak']
  if (timedPhases.includes(persisted.phase)) {
    let timeLeft: number
    if (persisted.isPaused) {
      timeLeft = persisted.pausedRemaining
    } else if (persisted.targetEnd != null) {
      timeLeft = Math.max(0, Math.round((persisted.targetEnd - Date.now()) / 1000))
    } else {
      timeLeft = 0
    }
    // 如果剩余时间为 0 则当作已完成，转到对应的 complete 阶段
    if (timeLeft === 0 && !persisted.isPaused) {
      const completeMap: Partial<Record<Phase, Phase>> = {
        try: 'tryComplete',
        focus: 'focusComplete',
        shortBreak: 'shortBreakComplete',
        longBreak: 'longBreakComplete',
      }
      return {
        ...base,
        phase: completeMap[persisted.phase] ?? 'idle',
        taskName: persisted.taskName,
        breakChoice: persisted.breakChoice,
        timeLeft: 0,
        isPaused: false,
      }
    }
    return {
      ...base,
      phase: persisted.phase,
      taskName: persisted.taskName,
      breakChoice: persisted.breakChoice,
      timeLeft,
      isPaused: persisted.isPaused,
    }
  }

  // 非计时阶段直接恢复（complete / select 阶段）
  return {
    ...base,
    phase: persisted.phase,
    taskName: persisted.taskName,
    breakChoice: persisted.breakChoice,
    timeLeft: 0,
    isPaused: false,
  }
}

export function usePomodoroMachine(): MachineState & MachineActions {
  const [state, setState] = useState<MachineState>(buildInitialState)

  // targetEndTime：计时终点 ms timestamp（抗漂移核心）
  const targetEndRef = useRef<number | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── 持久化 state 到 localStorage ────────────────────
  const persist = useCallback((s: MachineState, targetEnd: number | null) => {
    storage.savePhaseState({
      phase: s.phase,
      targetEnd,
      taskName: s.taskName,
      breakChoice: s.breakChoice,
      isPaused: s.isPaused,
      pausedRemaining: s.timeLeft,
    })
  }, [])

  // ── 启动计时 ──────────────────────────────────────
  const startTimer = useCallback(
    (durationSec: number, nextState: Partial<MachineState>) => {
      if (tickRef.current) clearInterval(tickRef.current)
      const end = Date.now() + durationSec * 1000
      targetEndRef.current = end

      setState((prev) => {
        const s: MachineState = {
          ...prev,
          ...nextState,
          timeLeft: durationSec,
          isPaused: false,
        }
        persist(s, end)
        return s
      })

      tickRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.round((end - Date.now()) / 1000))
        setState((prev) => {
          if (prev.isPaused) return prev  // 暂停时 tick 不更新
          if (remaining === 0) {
            // 计时结束，转 complete 阶段
            if (tickRef.current) clearInterval(tickRef.current)
            tickRef.current = null
            const completeMap: Partial<Record<Phase, Phase>> = {
              try: 'tryComplete',
              focus: 'focusComplete',
              shortBreak: 'shortBreakComplete',
              longBreak: 'longBreakComplete',
            }
            const next: MachineState = {
              ...prev,
              phase: completeMap[prev.phase] ?? prev.phase,
              timeLeft: 0,
            }
            // focus 完成时记录统计
            if (prev.phase === 'focus') {
              storage.incrementTotal()
              storage.incrementToday()
              const newGroup = prev.groupCount + 1
              // 不在此处重置 groupCount，让 focusComplete 先用它判断是否长休
              // 重置在 skipLongBreak / startNewRound / startLongBreak 中处理
              storage.setGroupCount(newGroup)
              storage.setLastTask(prev.taskName)
              const updated: MachineState = {
                ...next,
                groupCount: newGroup,
                todayCount: prev.todayCount + 1,
                totalCount: prev.totalCount + 1,
              }
              persist(updated, null)
              return updated
            }
            persist(next, null)
            return next
          }
          return { ...prev, timeLeft: remaining }
        })
      }, 500) // 500ms tick 保证响应及时
    },
    [persist]
  )

  // ── 恢复计时（页面加载时如果 phase 是计时阶段）────────
  useEffect(() => {
    const persisted = storage.loadPhaseState()
    const timedPhases: Phase[] = ['try', 'focus', 'shortBreak', 'longBreak']
    if (persisted && timedPhases.includes(persisted.phase) && !persisted.isPaused) {
      const end = persisted.targetEnd
      if (end && end > Date.now()) {
        targetEndRef.current = end
        if (tickRef.current) clearInterval(tickRef.current)
        tickRef.current = setInterval(() => {
          const remaining = Math.max(0, Math.round((end - Date.now()) / 1000))
          setState((prev) => {
            if (prev.isPaused) return prev
            if (remaining === 0) {
              if (tickRef.current) clearInterval(tickRef.current)
              tickRef.current = null
              const completeMap: Partial<Record<Phase, Phase>> = {
                try: 'tryComplete',
                focus: 'focusComplete',
                shortBreak: 'shortBreakComplete',
                longBreak: 'longBreakComplete',
              }
              const next: MachineState = {
                ...prev,
                phase: completeMap[prev.phase] ?? prev.phase,
                timeLeft: 0,
              }
              if (prev.phase === 'focus') {
                storage.incrementTotal()
                storage.incrementToday()
                const newGroup = prev.groupCount + 1
                storage.setGroupCount(newGroup)
                storage.setLastTask(prev.taskName)
                const updated: MachineState = {
                  ...next,
                  groupCount: newGroup,
                  todayCount: prev.todayCount + 1,
                  totalCount: prev.totalCount + 1,
                }
                persist(updated, null)
                return updated
              }
              persist(next, null)
              return next
            }
            return { ...prev, timeLeft: remaining }
          })
        }, 500)
      }
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Actions ──────────────────────────────────────────

  const startTry = useCallback(() => {
    startTimer(DURATIONS.try, { phase: 'try', taskName: '', breakChoice: '' })
  }, [startTimer])

  const startFocus = useCallback(
    (task: string) => {
      storage.setLastTask(task)
      startTimer(DURATIONS.focus, { phase: 'focus', taskName: task, breakChoice: '' })
    },
    [startTimer]
  )

  const pauseResume = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'focus') return prev
      if (prev.isPaused) {
        // 恢复：重新设置 targetEnd
        const end = Date.now() + prev.timeLeft * 1000
        targetEndRef.current = end
        if (tickRef.current) clearInterval(tickRef.current)
        tickRef.current = setInterval(() => {
          const remaining = Math.max(0, Math.round((end - Date.now()) / 1000))
          setState((s) => {
            if (s.isPaused) return s
            if (remaining === 0) {
              if (tickRef.current) clearInterval(tickRef.current)
              tickRef.current = null
              storage.incrementTotal()
              storage.incrementToday()
              const newGroup = s.groupCount + 1
              storage.setGroupCount(newGroup)
              storage.setLastTask(s.taskName)
              const updated: MachineState = {
                ...s,
                phase: 'focusComplete',
                timeLeft: 0,
                groupCount: newGroup,
                todayCount: s.todayCount + 1,
                totalCount: s.totalCount + 1,
              }
              persist(updated, null)
              return updated
            }
            return { ...s, timeLeft: remaining }
          })
        }, 500)
        const next = { ...prev, isPaused: false }
        persist(next, end)
        return next
      } else {
        // 暂停
        if (tickRef.current) clearInterval(tickRef.current)
        tickRef.current = null
        targetEndRef.current = null
        const next = { ...prev, isPaused: true }
        persist(next, null)
        return next
      }
    })
  }, [persist])

  const abandonFocus = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = null
    targetEndRef.current = null
    storage.clearPhaseState()
    setState((prev) => ({
      ...prev,
      phase: 'idle',
      timeLeft: 0,
      isPaused: false,
    }))
  }, [])

  const exitToIdle = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = null
    targetEndRef.current = null
    storage.clearPhaseState()
    setState((prev) => ({
      ...prev,
      phase: 'idle',
      timeLeft: 0,
      isPaused: false,
      taskName: storage.getLastTask(),
      // 刷新统计
      todayCount: storage.getTodayCount(),
      totalCount: storage.getTotal(),
      groupCount: storage.getGroupCount(),
    }))
  }, [])

  const completeTryThenFocus = useCallback(
    (task: string) => {
      storage.setLastTask(task)
      startTimer(DURATIONS.focus, { phase: 'focus', taskName: task, breakChoice: '' })
    },
    [startTimer]
  )

  // focusComplete → shortBreakSelect（显示休息方式选择页）
  const goToShortBreakSelect = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = null
    setState((prev) => {
      const next = { ...prev, phase: 'shortBreakSelect' as Phase }
      persist(next, null)
      return next
    })
  }, [persist])

  const selectBreak = useCallback(
    (choice: string) => {
      startTimer(DURATIONS.shortBreak, {
        phase: 'shortBreak',
        breakChoice: choice,
      })
    },
    [startTimer]
  )

  const startNextFocus = useCallback(
    (task: string) => {
      storage.setLastTask(task)
      startTimer(DURATIONS.focus, { phase: 'focus', taskName: task, breakChoice: '' })
    },
    [startTimer]
  )

  const acknowledgeShortBreakDone = useCallback(
    (task: string) => {
      storage.setLastTask(task)
      startTimer(DURATIONS.focus, { phase: 'focus', taskName: task, breakChoice: '' })
    },
    [startTimer]
  )

  const startLongBreak = useCallback(() => {
    // 重置组计数——长休开始意味着新一轮
    storage.setGroupCount(0)
    startTimer(DURATIONS.longBreak, { phase: 'longBreak', breakChoice: '', groupCount: 0 })
  }, [startTimer])

  const skipLongBreak = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = null
    targetEndRef.current = null
    storage.setGroupCount(0)
    storage.clearPhaseState()
    setState((prev) => ({
      ...prev,
      phase: 'idle',
      timeLeft: 0,
      isPaused: false,
      groupCount: 0,
      todayCount: storage.getTodayCount(),
      totalCount: storage.getTotal(),
    }))
  }, [])

  const startNewRound = useCallback(() => {
    storage.setGroupCount(0)
    storage.clearPhaseState()
    setState((prev) => ({
      ...prev,
      phase: 'idle',
      timeLeft: 0,
      isPaused: false,
      groupCount: 0,
      todayCount: storage.getTodayCount(),
      totalCount: storage.getTotal(),
    }))
  }, [])

  return {
    ...state,
    startTry,
    startFocus,
    pauseResume,
    abandonFocus,
    exitToIdle,
    completeTryThenFocus,
    goToShortBreakSelect,
    selectBreak,
    startNextFocus,
    acknowledgeShortBreakDone,
    startLongBreak,
    skipLongBreak,
    startNewRound,
  }
}

// 格式化秒数为 MM:SS
export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
