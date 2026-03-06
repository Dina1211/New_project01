import { useState } from 'react'
import * as storage from '../storage'
import type { MachineState, MachineActions } from '../hooks/usePomodoroMachine'

type Props = Pick<
  MachineState & MachineActions,
  | 'todayCount'
  | 'totalCount'
  | 'groupCount'
  | 'taskName'
  | 'taskHistory'
  | 'completedGroupsToday'
  | 'startTry'
  | 'startFocus'
>

const MAX_TASK_LEN = 20

export function HomeView({ todayCount, totalCount, groupCount, taskName: savedTask, taskHistory, completedGroupsToday, startTry, startFocus }: Props) {
  const [showFocusInput, setShowFocusInput] = useState(false)
  const [task, setTask] = useState(savedTask)
  const [wrapped, setWrapped] = useState(() => storage.hasWrappedUpToday())
  const [showWrapup, setShowWrapup] = useState(false)

  const todayMinutes = todayCount * 25
  const canStart = task.trim().length > 0 && task.trim().length <= MAX_TASK_LEN

  const encouragement =
    todayCount === 0
      ? '今天还没开始，随时出发都不晚 🌱'
      : todayCount < 3
      ? `今天已完成 ${todayCount} 个番茄，继续加油！`
      : `今天已完成 ${todayCount} 个番茄，专注力不错 🔥`

  const handleWrapup = () => {
    storage.markWrappedUpToday()
    setWrapped(true)
    setShowWrapup(true)
  }

  return (
    <>
      {/* 今日收尾弹窗 */}
      {showWrapup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl flex flex-col gap-5">
            <div className="text-center">
              <div className="text-5xl mb-2">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800">今日收尾</h2>
            </div>
            <div className="bg-orange-50 rounded-2xl p-5 grid grid-cols-2 divide-x divide-orange-100 text-center">
              <div className="pr-4">
                <p className="text-3xl font-bold text-orange-500">{todayCount}</p>
                <p className="text-xs text-gray-500 mt-1">个番茄完成</p>
              </div>
              <div className="pl-4">
                <p className="text-3xl font-bold text-orange-500">{todayMinutes}</p>
                <p className="text-xs text-gray-500 mt-1">分钟专注时长</p>
              </div>
            </div>
            <p className="text-center text-gray-500 text-sm">你今天做到了，明天继续 💪</p>
            <button
              onClick={() => setShowWrapup(false)}
              className="w-full py-3 rounded-2xl bg-orange-500 text-white font-bold text-lg active:scale-95 transition-transform"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 主内容 */}
      {showFocusInput ? (
        <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg p-8 flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center">这次要做什么？</h2>

            <div>
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value.slice(0, MAX_TASK_LEN))}
                placeholder="输入任务名（最多 20 字）"
                autoFocus
                className="w-full border-2 border-orange-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:border-orange-400 transition-colors"
              />
              <p className="text-right text-xs text-gray-400 mt-1">{task.trim().length} / {MAX_TASK_LEN}</p>
            </div>

            <button
              disabled={!canStart}
              onClick={() => startFocus(task.trim())}
              className="w-full py-4 rounded-2xl text-xl font-bold text-white bg-orange-500 disabled:bg-orange-200 disabled:cursor-not-allowed transition-colors active:scale-95"
            >
              开始 25mins 🍅
            </button>

            <button
              onClick={() => setShowFocusInput(false)}
              className="text-sm text-gray-400 text-center hover:text-gray-600 transition-colors"
            >
              返回
            </button>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm flex flex-col gap-6">

            <div className="text-center">
              <div className="text-5xl mb-2">🍅</div>
              <h1 className="text-3xl font-bold text-gray-800">番茄专注</h1>
              <p className="text-sm text-gray-500 mt-1">{encouragement}</p>
            </div>

            {/* 组进度 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-2 text-center">当前组进度</p>
              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                      i < groupCount
                        ? 'bg-orange-400 text-white shadow-md'
                        : 'bg-orange-100 text-orange-300'
                    }`}
                  >
                    🍅
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">{groupCount} / 4 番茄</p>
            </div>

            {/* 统计 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm grid grid-cols-3 divide-x divide-gray-100 text-center">
              <div className="px-2">
                <p className="text-2xl font-bold text-orange-500">{todayCount}</p>
                <p className="text-xs text-gray-400 mt-1">今日完成</p>
              </div>
              <div className="px-2">
                <p className="text-2xl font-bold text-orange-500">{todayMinutes}</p>
                <p className="text-xs text-gray-400 mt-1">今日分钟</p>
              </div>
              <div className="px-2">
                <p className="text-2xl font-bold text-orange-500">{totalCount}</p>
                <p className="text-xs text-gray-400 mt-1">累计番茄</p>
              </div>
            </div>

            {/* 今日完成组 */}
            {completedGroupsToday > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-gray-400 mb-3 text-center">今日完成组</p>
                <div className="flex flex-col gap-2">
                  {Array.from({ length: completedGroupsToday }).map((_, i) => (
                    <div key={i} className="flex justify-center gap-3">
                      {[0, 1, 2, 3].map((j) => (
                        <div
                          key={j}
                          className="w-9 h-9 rounded-full bg-orange-400 flex items-center justify-center text-base shadow-sm"
                        >
                          🍅
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-orange-400 font-medium mt-3">
                  已完成 {completedGroupsToday} 组 · 共 {completedGroupsToday * 4} 个番茄 🏆
                </p>
              </div>
            )}

            {/* 今日任务历史 */}
            {Object.keys(taskHistory).length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-gray-400 mb-3 text-center">今日任务</p>
                <div className="flex flex-col gap-2">
                  {Object.entries(taskHistory).map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 truncate flex-1 mr-2">{name}</span>
                      <span className="text-sm font-semibold text-orange-500 whitespace-nowrap">🍅 ×{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 入口按钮 */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowFocusInput(true)}
                className="w-full py-5 rounded-3xl text-xl font-bold text-white bg-orange-500 shadow-lg active:scale-95 transition-transform"
              >
                开始 25mins 🍅
              </button>
              <button
                onClick={startTry}
                className="w-full py-4 rounded-3xl text-lg font-semibold text-orange-500 bg-white border-2 border-orange-200 shadow-sm active:scale-95 transition-transform"
              >
                5mins 试一下 ✨
              </button>
            </div>

            {/* 今日收尾 */}
            <button
              disabled={wrapped}
              onClick={handleWrapup}
              className={`w-full py-3 rounded-2xl text-sm font-medium transition-colors ${
                wrapped
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-orange-200 hover:text-orange-400 active:scale-95'
              }`}
            >
              {wrapped ? '今日已收尾 ✓' : '今天尽力啦 ✨'}
            </button>

            <p className="text-center text-xs text-gray-300">
              5mins 不计入统计 · 专注先于完美
            </p>
          </div>
        </div>
      )}
    </>
  )
}
