import { useState } from 'react'
import type { MachineState, MachineActions } from '../hooks/usePomodoroMachine'
import { formatTime, DURATIONS } from '../hooks/usePomodoroMachine'
import { getLastTask } from '../storage'

type Props = Pick<
  MachineState & MachineActions,
  | 'phase'
  | 'timeLeft'
  | 'breakChoice'
  | 'taskName'
  | 'startNextFocus'
  | 'exitToIdle'
>

const MAX_TASK_LEN = 20

export function BreakTimerView({ phase, timeLeft, breakChoice, taskName, startNextFocus, exitToIdle }: Props) {
  const [nextTask, setNextTask] = useState(taskName || getLastTask())
  const canStart = nextTask.trim().length > 0 && nextTask.trim().length <= MAX_TASK_LEN

  if (phase === 'shortBreak') {
    const progress = timeLeft / DURATIONS.shortBreak  // 1→0

    return (
      <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col items-center gap-6">

          <div className="text-center">
            <p className="text-xs text-sky-500 font-medium mb-1">💆 短暂休息</p>
            <h2 className="text-xl font-bold text-gray-800">{breakChoice}</h2>
          </div>

          <div className="relative w-56 h-56">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#e0f2fe" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress)}`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-4xl font-mono font-bold text-sky-700">{formatTime(timeLeft)}</span>
              <span className="text-xs text-sky-400 mt-1">休息中</span>
            </div>
          </div>

          <button
            onClick={exitToIdle}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            跳过休息，回到首页
          </button>
        </div>
      </div>
    )
  }

  // shortBreakComplete：休息结束，复用/修改任务名后开始下一个
  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-6">
        <div className="text-center">
          <div className="text-5xl mb-3">⚡</div>
          <h2 className="text-2xl font-bold text-gray-800">休息结束！</h2>
          <p className="text-gray-500 text-sm mt-2">准备好迎接下一个番茄了吗？</p>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2 font-medium">下一个任务（可修改）：</p>
          <input
            type="text"
            value={nextTask}
            onChange={(e) => setNextTask(e.target.value.slice(0, MAX_TASK_LEN))}
            placeholder="任务名（最多 20 字）"
            className="w-full border-2 border-orange-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:border-orange-400 transition-colors"
          />
          <p className="text-right text-xs text-gray-400 mt-1">{nextTask.trim().length} / {MAX_TASK_LEN}</p>
        </div>

        <button
          disabled={!canStart}
          onClick={() => startNextFocus(nextTask.trim())}
          className="w-full py-4 rounded-2xl text-xl font-bold text-white bg-orange-500 disabled:bg-orange-200 disabled:cursor-not-allowed transition-colors active:scale-95"
        >
          开始下一个 25mins 🍅
        </button>

        <button
          onClick={exitToIdle}
          className="text-sm text-gray-400 text-center hover:text-gray-600 transition-colors"
        >
          回到首页
        </button>
      </div>
    </div>
  )
}
