import { useEffect } from 'react'
import { usePomodoroMachine } from './hooks/usePomodoroMachine'
import { HomeView } from './components/HomeView'
import { TryView } from './components/TryView'
import { FocusView } from './components/FocusView'
import { BreakSelectView } from './components/BreakSelectView'
import { BreakTimerView } from './components/BreakTimerView'
import { LongBreakView } from './components/LongBreakView'

export default function App() {
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const {
    phase,
    taskName,
    breakChoice,
    timeLeft,
    isPaused,
    groupCount,
    todayCount,
    totalCount,
    taskHistory,
    startTry,
    startFocus,
    pauseResume,
    abandonFocus,
    exitToIdle,
    completeTryThenFocus,
    goToShortBreakSelect,
    selectBreak,
    startNextFocus,
    startLongBreak,
    skipLongBreak,
    startNewRound,
  } = usePomodoroMachine()

  switch (phase) {
    case 'idle':
      return (
        <HomeView
          todayCount={todayCount}
          totalCount={totalCount}
          groupCount={groupCount}
          taskName={taskName}
          taskHistory={taskHistory}
          startTry={startTry}
          startFocus={startFocus}
        />
      )

    case 'try':
    case 'tryComplete':
      return (
        <TryView
          phase={phase}
          timeLeft={timeLeft}
          exitToIdle={exitToIdle}
          completeTryThenFocus={completeTryThenFocus}
        />
      )

    case 'focus':
    case 'focusComplete':
      return (
        <FocusView
          phase={phase}
          timeLeft={timeLeft}
          isPaused={isPaused}
          taskName={taskName}
          groupCount={groupCount}
          pauseResume={pauseResume}
          abandonFocus={abandonFocus}
          exitToIdle={exitToIdle}
          startLongBreak={startLongBreak}
          skipLongBreak={skipLongBreak}
          goToShortBreakSelect={goToShortBreakSelect}
          startNextFocus={startNextFocus}
        />
      )

    case 'shortBreakSelect':
      return (
        <BreakSelectView
          selectBreak={selectBreak}
          exitToIdle={exitToIdle}
        />
      )

    case 'shortBreak':
    case 'shortBreakComplete':
      return (
        <BreakTimerView
          phase={phase}
          timeLeft={timeLeft}
          breakChoice={breakChoice}
          taskName={taskName}
          startNextFocus={startNextFocus}
          exitToIdle={exitToIdle}
        />
      )

    case 'longBreak':
    case 'longBreakComplete':
      return (
        <LongBreakView
          phase={phase}
          timeLeft={timeLeft}
          skipLongBreak={skipLongBreak}
          startNewRound={startNewRound}
        />
      )

    default:
      return null
  }
}
