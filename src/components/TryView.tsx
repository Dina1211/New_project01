import { useState } from 'react'
import type { MachineState, MachineActions } from '../hooks/usePomodoroMachine'
import { formatTime, DURATIONS } from '../hooks/usePomodoroMachine'

type Props = Pick<
  MachineState & MachineActions,
  | 'phase'
  | 'timeLeft'
  | 'exitToIdle'
  | 'completeTryThenFocus'
>

const MAX_TASK_LEN = 20

export function TryView({ phase, timeLeft, exitToIdle, completeTryThenFocus }: Props) {
  const [task, setTask] = useState('')
  const canContinue = task.trim().length > 0 && task.trim().length <= MAX_TASK_LEN

  if (phase === 'try') {
    const progress = timeLeft / DURATIONS.try

    return (
      <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col items-center gap-8">
          <div className="text-center">
            <p className="text-sm text-emerald-600 font-medium mb-1">✨ 试试 5 分钟</p>
            <p className="text-xs text-gray-400">不需要计划，先动起来就行</p>
          </div>

          <div className="relative w-56 h-56">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#d1fae5" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke="#10b981"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress)}`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-5xl font-mono font-bold text-emerald-700">{formatTime(timeLeft)}</span>
              <span className="text-sm text-emerald-500 mt-1">剩余</span>
            </div>
          </div>

          <button
            onClick={exitToIdle}
            className="w-full py-4 rounded-2xl text-lg font-semibold text-gray-500 bg-white border-2 border-gray-200 shadow-sm active:scale-95 transition-transform"
          >
            退出（不记录）
          </button>
        </div>
      </div>
    )
  }

  // tryComplete：显示完成弹窗
  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800">5 分钟完成！</h2>
          <p className="text-gray-500 text-sm mt-2">热身完毕，要继续来一个完整的番茄吗？</p>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2 font-medium">输入任务继续 25mins：</p>
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value.slice(0, MAX_TASK_LEN))}
            placeholder="任务名（最多 20 字）"
            autoFocus
            className="w-full border-2 border-orange-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:border-orange-400 transition-colors"
          />
          <p className="text-right text-xs text-gray-400 mt-1">{task.trim().length} / {MAX_TASK_LEN}</p>
        </div>

        <button
          disabled={!canContinue}
          onClick={() => completeTryThenFocus(task.trim())}
          className="w-full py-4 rounded-2xl text-xl font-bold text-white bg-orange-500 disabled:bg-orange-200 disabled:cursor-not-allowed transition-colors active:scale-95"
        >
          继续 25mins 🍅
        </button>

        <button
          onClick={exitToIdle}
          className="w-full py-4 rounded-2xl text-lg font-semibold text-gray-500 bg-gray-50 border border-gray-200 active:scale-95 transition-transform"
        >
          结束并退出
        </button>
      </div>
    </div>
  )
}
