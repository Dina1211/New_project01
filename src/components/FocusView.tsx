import { useState } from 'react'
import type { MachineState, MachineActions } from '../hooks/usePomodoroMachine'
import { formatTime, DURATIONS } from '../hooks/usePomodoroMachine'

type Props = Pick<
  MachineState & MachineActions,
  | 'phase'
  | 'timeLeft'
  | 'isPaused'
  | 'taskName'
  | 'groupCount'
  | 'pauseResume'
  | 'abandonFocus'
  | 'exitToIdle'
  | 'startLongBreak'
  | 'skipLongBreak'
  | 'goToShortBreakSelect'
  | 'startNextFocus'
>

export function FocusView({
  phase,
  timeLeft,
  isPaused,
  taskName,
  groupCount,
  pauseResume,
  abandonFocus,
  exitToIdle,
  startLongBreak,
  skipLongBreak,
  goToShortBreakSelect,
  startNextFocus,
}: Props) {
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false)

  // ── 计时中 ───────────────────────────────────────────
  if (phase === 'focus') {
    const progress = timeLeft / DURATIONS.focus  // 1→0

    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col items-center gap-6">

          <div className="text-center">
            <p className="text-xs text-orange-400 mb-1 font-medium">当前任务</p>
            <h2 className="text-xl font-bold text-gray-800 truncate max-w-xs">{taskName}</h2>
          </div>

          <div className="relative w-64 h-64">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#fed7aa" strokeWidth="7" />
              <circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke="#f97316"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress)}`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-5xl font-mono font-bold text-orange-600">{formatTime(timeLeft)}</span>
              {isPaused && <span className="text-sm text-orange-400 mt-1">已暂停</span>}
            </div>
          </div>

          <button
            onClick={pauseResume}
            className="w-full py-4 rounded-3xl text-xl font-bold text-white bg-orange-500 shadow-lg active:scale-95 transition-transform"
          >
            {isPaused ? '▶ 继续' : '⏸ 暂停'}
          </button>

          {/* 放弃（二次确认） */}
          {!showAbandonConfirm ? (
            <button
              onClick={() => setShowAbandonConfirm(true)}
              className="text-sm text-gray-400 hover:text-red-400 transition-colors"
            >
              放弃这个番茄
            </button>
          ) : (
            <div className="w-full bg-white rounded-2xl p-4 shadow border border-red-100 flex flex-col gap-3">
              <p className="text-center text-sm text-gray-600">确定放弃？本次不计入统计。</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAbandonConfirm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 active:scale-95 transition-transform"
                >
                  继续专注
                </button>
                <button
                  onClick={abandonFocus}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-red-400 active:scale-95 transition-transform"
                >
                  确认放弃
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── focusComplete：第 4 个番茄，提示长休 ─────────────
  const isLongBreakTime = groupCount % 4 === 0 && groupCount > 0

  if (isLongBreakTime) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-6">
          <div className="text-center">
            <div className="text-5xl mb-3">🏆</div>
            <h2 className="text-2xl font-bold text-gray-800">完成 4 个番茄！</h2>
            <p className="text-gray-500 text-sm mt-2">恭喜完成一轮，好好休息 30 分钟吧</p>
          </div>

          <button
            onClick={startLongBreak}
            className="w-full py-4 rounded-2xl text-xl font-bold text-white bg-violet-500 shadow active:scale-95 transition-transform"
          >
            开始 30min 长休 ☕
          </button>
          <button
            onClick={skipLongBreak}
            className="w-full py-4 rounded-2xl text-lg font-semibold text-gray-500 bg-gray-50 border border-gray-200 active:scale-95 transition-transform"
          >
            跳过，回到首页
          </button>
        </div>
      </div>
    )
  }

  // ── focusComplete：普通番茄完成，提示短休或继续 ──────
  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-6">
        <div className="text-center">
          <div className="text-5xl mb-3">✅</div>
          <h2 className="text-2xl font-bold text-gray-800">番茄完成！</h2>
          <p className="text-gray-500 text-sm mt-2">
            已完成 <span className="font-bold text-orange-500">{groupCount}</span> / 4
          </p>
        </div>

        <button
          onClick={goToShortBreakSelect}
          className="w-full py-4 rounded-2xl text-xl font-bold text-white bg-sky-400 shadow active:scale-95 transition-transform"
        >
          休息 5min 💧
        </button>

        <button
          onClick={() => startNextFocus(taskName)}
          className="w-full py-4 rounded-2xl text-lg font-semibold text-orange-500 bg-orange-50 border-2 border-orange-200 active:scale-95 transition-transform"
        >
          跳过休息，继续 25mins
        </button>

        <button
          onClick={exitToIdle}
          className="text-sm text-gray-400 text-center hover:text-gray-600"
        >
          回到首页
        </button>
      </div>
    </div>
  )
}
