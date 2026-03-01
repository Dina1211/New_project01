import type { MachineState, MachineActions } from '../hooks/usePomodoroMachine'
import { formatTime, DURATIONS } from '../hooks/usePomodoroMachine'

type Props = Pick<
  MachineState & MachineActions,
  | 'phase'
  | 'timeLeft'
  | 'skipLongBreak'
  | 'startNewRound'
>

export function LongBreakView({ phase, timeLeft, skipLongBreak, startNewRound }: Props) {
  if (phase === 'longBreak') {
    const progress = timeLeft / DURATIONS.longBreak  // 1→0

    return (
      <div className="min-h-screen bg-purple-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col items-center gap-6">

          <div className="text-center">
            <p className="text-xs text-purple-500 font-medium mb-1">☕ 长休息</p>
            <h2 className="text-xl font-bold text-gray-800">好好休息 30 分钟</h2>
            <p className="text-xs text-gray-400 mt-1">完成了 4 个番茄，你值得这次休息</p>
          </div>

          <div className="relative w-64 h-64">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#ede9fe" strokeWidth="7" />
              <circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress)}`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-4xl font-mono font-bold text-purple-700">{formatTime(timeLeft)}</span>
              <span className="text-xs text-purple-400 mt-1">剩余</span>
            </div>
          </div>

          <button
            onClick={skipLongBreak}
            className="w-full py-4 rounded-2xl text-lg font-semibold text-gray-500 bg-white border-2 border-gray-200 shadow-sm active:scale-95 transition-transform"
          >
            跳过长休，回到首页
          </button>
        </div>
      </div>
    )
  }

  // longBreakComplete
  return (
    <div className="min-h-screen bg-purple-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🌟</div>
          <h2 className="text-2xl font-bold text-gray-800">休息结束！</h2>
          <p className="text-gray-500 text-sm mt-2">精力已恢复，开启新的一轮吧</p>
        </div>

        <button
          onClick={startNewRound}
          className="w-full py-5 rounded-3xl text-xl font-bold text-white bg-orange-500 shadow-lg active:scale-95 transition-transform"
        >
          开始新一轮 🍅
        </button>
      </div>
    </div>
  )
}
