import { points, STORAGE_KEY } from './data'
import { AppScreen, AppStateSnapshot } from './types'

const ONBOARDING_KEY = 'gallery-onboarding-complete'
const SOUND_ENABLED_KEY = 'gallery-sound-enabled'
const CAMERA_PERMISSION_KEY = 'gallery-camera-permission-granted'
const NEXT_POINT_HINTS_KEY = 'gallery-next-point-hints'
const CONTENT_GESTURE_HINT_KEY = 'gallery-content-gesture-hint'
const APP_STATE_KEY = 'gallery-app-state'

const appScreens: AppScreen[] = [
  'loader',
  'onboardingPrompt',
  'onboardingSlide',
  'routeModePrompt',
  'guideIntro',
  'pointInfo',
  'pointContent',
  'infoComplete',
  'nextPoint',
  'routeComplete',
  'routeList',
  'cameraPermission',
  'scanner',
  'map',
]

const pointScreenIds = new Set<AppScreen>([
  'pointInfo',
  'pointContent',
  'infoComplete',
  'nextPoint',
  'routeComplete',
  'routeList',
  'scanner',
  'map',
])

const isAppScreen = (value: string): value is AppScreen =>
  appScreens.includes(value as AppScreen)

export const saveAppState = (snapshot: AppStateSnapshot) => {
  // Persist the last active story/screen so refreshes can restore progress.
  const payload: AppStateSnapshot = {
    storyId: snapshot.storyId ?? null,
    screenId: snapshot.screenId,
    step: snapshot.step,
    contentIndex: snapshot.contentIndex,
    slideIndex: snapshot.slideIndex,
    routeMode: snapshot.routeMode,
  }
  localStorage.setItem(APP_STATE_KEY, JSON.stringify(payload))
}

export const restoreAppState = (): AppStateSnapshot | null => {
  const stored = localStorage.getItem(APP_STATE_KEY)
  if (!stored) return null

  try {
    // Guard against malformed or outdated data.
    const parsed = JSON.parse(stored) as Partial<AppStateSnapshot> | null
    if (!parsed || typeof parsed.screenId !== 'string' || !isAppScreen(parsed.screenId)) {
      return null
    }

    if (pointScreenIds.has(parsed.screenId) && !parsed.storyId) {
      return null
    }

    if (parsed.storyId) {
      const storyExists = points.some((point) => point.id === parsed.storyId)
      if (!storyExists) return null
    }

    return {
      storyId: parsed.storyId ?? null,
      screenId: parsed.screenId,
      step: typeof parsed.step === 'number' ? parsed.step : undefined,
      contentIndex: typeof parsed.contentIndex === 'number' ? parsed.contentIndex : undefined,
      slideIndex: typeof parsed.slideIndex === 'number' ? parsed.slideIndex : undefined,
      routeMode: parsed.routeMode === 'guide' || parsed.routeMode === 'solo' ? parsed.routeMode : undefined,
    }
  } catch (err) {
    console.warn('[storage] failed to parse app state', err)
    return null
  }
}

export const clearAppState = () => {
  localStorage.removeItem(APP_STATE_KEY)
}

// Responsible for persisting which points were already viewed by the visitor
export const loadViewed = (): Set<string> => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return new Set()
  try {
    const parsed = JSON.parse(stored)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch (err) {
    console.warn('Не удалось прочитать просмотренные точки', err)
    return new Set()
  }
}

export const saveViewed = (set: Set<string>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)))
}

export const loadOnboardingCompleted = (): boolean => {
  return localStorage.getItem(ONBOARDING_KEY) === 'true'
}

export const saveOnboardingCompleted = () => {
  localStorage.setItem(ONBOARDING_KEY, 'true')
}

export const loadSoundEnabled = (): boolean => {
  const stored = localStorage.getItem(SOUND_ENABLED_KEY)
  return stored === null ? false : stored === 'true'
}

export const saveSoundEnabled = (enabled: boolean) => {
  localStorage.setItem(SOUND_ENABLED_KEY, String(enabled))
}

export const loadCameraPermissionGranted = (): boolean => {
  return localStorage.getItem(CAMERA_PERMISSION_KEY) === 'true'
}

export const saveCameraPermissionGranted = () => {
  localStorage.setItem(CAMERA_PERMISSION_KEY, 'true')
}

export const loadNextPointHintsCompleted = (): boolean => {
  return localStorage.getItem(NEXT_POINT_HINTS_KEY) === 'true'
}

export const saveNextPointHintsCompleted = () => {
  localStorage.setItem(NEXT_POINT_HINTS_KEY, 'true')
}

export const loadContentGestureHintCompleted = (): boolean => {
  return localStorage.getItem(CONTENT_GESTURE_HINT_KEY) === 'true'
}

export const saveContentGestureHintCompleted = () => {
  localStorage.setItem(CONTENT_GESTURE_HINT_KEY, 'true')
}
