import { initialMapPositions, points } from './data'
import {
  loadCameraPermissionGranted,
  loadContentGestureHintCompleted,
  loadOnboardingCompleted,
  loadNextPointHintsCompleted,
  loadSoundEnabled,
  restoreAppState,
  clearAppState,
  loadViewed,
  saveViewed,
} from './storage'
import { AppState, DeepLinkTarget, NavigationTarget, RenderCleanup } from './types'

// Centralized app state used across all screens
const soundEnabled = loadSoundEnabled()
const onboardingCompleted = loadOnboardingCompleted()
const cameraPermissionGranted = loadCameraPermissionGranted()
const nextPointHintsCompleted = loadNextPointHintsCompleted()
const contentGestureHintCompleted = loadContentGestureHintCompleted()
export let viewedPoints = loadViewed()

export const isRouteCompleted = (): boolean => viewedPoints.size >= points.length

export const resetProgress = () => {
  viewedPoints = new Set()
  saveViewed(viewedPoints)
  state.currentPointIndex = 0
  state.currentContentIndex = 0
  clearAppState()
}

export const resolveNextPointIndex = (): number => {
  const firstIncompleteIndex = points.findIndex((point) => !viewedPoints.has(point.id))

  if (firstIncompleteIndex !== -1) return firstIncompleteIndex

  return Math.max(points.length - 1, 0)
}

export const getFirstUnviewedPointIndex = (): number => {
  const firstIncompleteIndex = points.findIndex((point) => !viewedPoints.has(point.id))

  if (firstIncompleteIndex !== -1) return firstIncompleteIndex

  return Math.max(points.length - 1, 0)
}

const parseDeepLinkFromUrl = (): DeepLinkTarget | null => {
  try {
    const url = new URL(window.location.href)
    const periodValue = url.searchParams.get('period')
    if (periodValue) {
      const periodNumber = Number.parseInt(periodValue, 10)
      const zeroBasedIndex = periodNumber - 1
      if (Number.isInteger(periodNumber) && zeroBasedIndex >= 0 && zeroBasedIndex < points.length) {
        return { pointIndex: zeroBasedIndex, paramKey: 'period' }
      }
    }

    const storyId = url.searchParams.get('storyId')
    if (storyId) {
      const storyIndex = points.findIndex((point) => point.id === storyId)
      if (storyIndex !== -1) {
        return { pointIndex: storyIndex, paramKey: 'storyId' }
      }
    }

    const pointId = url.searchParams.get('pointId')
    if (pointId) {
      const pointIndex = points.findIndex((point) => point.id === pointId)
      if (pointIndex !== -1) {
        return { pointIndex, paramKey: 'pointId' }
      }
    }
  } catch (error) {
    console.warn('[state] failed to parse deep link URL', error)
  }

  return null
}

const decideStartupTarget = (): { mode: 'deeplink' | 'restore' | 'default'; target?: NavigationTarget } => {
  const deepLinkTarget = parseDeepLinkFromUrl()
  if (deepLinkTarget) {
    return {
      mode: 'deeplink',
      target: {
        source: 'deeplink',
        screenId: 'pointContent',
        pointIndex: deepLinkTarget.pointIndex,
        contentIndex: 0,
        paramKey: deepLinkTarget.paramKey,
      },
    }
  }

  const restoredState = restoreAppState()
  if (restoredState) {
    const restoredPointIndex = restoredState.storyId
      ? points.findIndex((point) => point.id === restoredState.storyId)
      : null
    return {
      mode: 'restore',
      target: {
        source: 'restore',
        screenId: restoredState.screenId,
        pointIndex: typeof restoredPointIndex === 'number' && restoredPointIndex >= 0 ? restoredPointIndex : undefined,
        contentIndex: restoredState.contentIndex ?? restoredState.step,
        slideIndex: restoredState.slideIndex ?? restoredState.step,
        routeMode: restoredState.routeMode,
      },
    }
  }

  return { mode: 'default' }
}

export const clearDeepLinkParam = (paramKey: DeepLinkTarget['paramKey'] | undefined) => {
  if (!paramKey) return
  try {
    const url = new URL(window.location.href)
    if (!url.searchParams.has(paramKey)) return
    url.searchParams.delete(paramKey)
    const search = url.searchParams.toString()
    const nextUrl = `${url.pathname}${search ? `?${search}` : ''}${url.hash}`
    window.history.replaceState(null, '', nextUrl)
  } catch (error) {
    console.warn('[state] failed to clear deep link param', error)
  }
}

export const applyNavigationTarget = (target: NavigationTarget) => {
  if (typeof target.pointIndex === 'number') {
    state.currentPointIndex = target.pointIndex
  }
  if (typeof target.contentIndex === 'number') {
    state.currentContentIndex = target.contentIndex
  }
  if (typeof target.slideIndex === 'number') {
    state.slideIndex = target.slideIndex
  }
  if (typeof target.routeMode === 'string') {
    state.routeMode = target.routeMode
  }
  state.screen = target.screenId
}

const startupDecision = decideStartupTarget()
const initialPointIndex =
  startupDecision.mode === 'deeplink' && typeof startupDecision.target?.pointIndex === 'number'
    ? startupDecision.target.pointIndex
    : resolveNextPointIndex()

export const state: AppState = {
  screen: 'loader',
  routeMode: 'guide',
  slideIndex: 0,
  currentPointIndex: initialPointIndex,
  currentFloor: 1,
  mapPositions: { ...initialMapPositions },
  currentContentIndex: 0,
  soundEnabled,
  onboardingCompleted,
  scannerExpectedPointIndex: null,
  scannerOrigin: null,
  cameraPermissionGranted,
  nextPointHintsCompleted,
  contentGestureHintCompleted,
  pendingNavigationTarget: startupDecision.mode === 'deeplink' ? startupDecision.target ?? null : null,
}

// Restore last active screen/state when no deep link is present.
if (startupDecision.mode === 'restore' && startupDecision.target) {
  applyNavigationTarget(startupDecision.target)
}

let teardown: RenderCleanup | null = null

export const resetTeardown = () => {
  if (typeof teardown === 'function') {
    teardown()
  }
  teardown = null
}

export const setTeardown = (cleanup: RenderCleanup | null) => {
  teardown = cleanup
}
