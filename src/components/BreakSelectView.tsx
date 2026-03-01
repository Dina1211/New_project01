import { useState } from 'react'
import type { MachineState, MachineActions } from '../hooks/usePomodoroMachine'

type Props = Pick<MachineState & MachineActions, 'selectBreak' | 'exitToIdle'>

const PRESET_OPTIONS = ['接水', '站起来观察环境', '走一走', '上厕所'] as const

export function BreakSelectView({ selectBreak, exitToIdle }: Props) {
  const [custom, setCustom] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const canSubmitCustom = custom.trim().length > 0 && custom.trim().length <= 20

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-6">

        <div className="text-center">
          <div className="text-4xl mb-2">💆</div>
          <h2 className="text-2xl font-bold text-gray-800">选择休息方式</h2>
          <p className="text-sm text-gray-500 mt-1">5 分钟，让身体动一动</p>
        </div>

        <div className="flex flex-col gap-3">
          {PRESET_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => selectBreak(opt)}
              className="w-full py-4 rounded-2xl text-lg font-semibold text-gray-700 bg-white shadow-sm border border-blue-100 active:scale-95 transition-transform hover:bg-blue-50"
            >
              {opt}
            </button>
          ))}

          {!showCustom ? (
            <button
              onClick={() => setShowCustom(true)}
              className="w-full py-4 rounded-2xl text-lg font-semibold text-blue-400 bg-white shadow-sm border border-blue-100 active:scale-95 transition-transform"
            >
              自定义...
            </button>
          ) : (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100 flex flex-col gap-3">
              <input
                type="text"
                value={custom}
                onChange={(e) => setCustom(e.target.value.slice(0, 20))}
                placeholder="输入休息内容（最多 20 字）"
                autoFocus
                className="w-full border-2 border-blue-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-blue-400"
              />
              <p className="text-right text-xs text-gray-400">{custom.trim().length} / 20</p>
              <button
                disabled={!canSubmitCustom}
                onClick={() => selectBreak(custom.trim())}
                className="w-full py-3 rounded-xl text-base font-bold text-white bg-blue-400 disabled:bg-blue-200 disabled:cursor-not-allowed active:scale-95 transition-transform"
              >
                确定
              </button>
            </div>
          )}
        </div>

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
