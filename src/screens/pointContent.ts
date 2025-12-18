// path: src/ui/renderPointContent.ts

import { pointContentConfigs, points } from '../data'
import { rerender } from '../navigation'
import { state } from '../state'
import { saveContentGestureHintCompleted, saveSoundEnabled } from '../storage'
import { loadSrtSubtitles, SubtitleCue, createCueFromText } from '../subtitles'
import { AudioContent, CardsContent, ModelsContent, PointContentSection, VideoContent } from '../types'
import { navigateToNextPoint } from './pointFlow'
import onboardingVoiceVideoWebm from '../assets/speaking-voice.webm'
import onboardingVoiceVideoMov from '../assets/speaking-voice.mov'
import { prefetchToObjectUrl } from "../mediaPrefetch";

const SWIPE_THRESHOLD = 48
const CARDS_DOWN_SWIPE_FACTOR = 2
    const EDGE_GUARD_PX = 24
    const INTENT_THRESHOLD = 8
    const H_DOMINANCE = 1.15

const MODEL_GESTURE_CLASS = 'model-gesture-active'
let playSession = 0;
type GestureHintStep = {
    text: string
    icon: string
    direction: 'up' | 'down'
}

let gestureFromModel = false
let gestureFromCards = false

const isFromModelViewer = (event: TouchEvent) => {
    const target = event.target as HTMLElement | null
    return !!target?.closest('.content-model__viewer')
}
const isFromCards = (event: TouchEvent) => {
    const target = event.target as HTMLElement | null
    return !!target?.closest('.content-panel--cards, .content-cards')
}

let audioAutoplayUnlocked = false
let isGestureOverlayVisible = false

const unlockAudioPlaybackOnce = (probeSrc?: string) => {
    if (audioAutoplayUnlocked) return
    if (!probeSrc) { audioAutoplayUnlocked = true; return }
    const probe = new Audio()
    probe.src = probeSrc
    probe.muted = true
    probe.volume = 0
    ;(probe as any).playsInline = true
    probe.setAttribute?.('playsinline', '')
    probe.play()
        .then(() => { try { probe.pause() } catch {} audioAutoplayUnlocked = true })
        .catch(() => { /* игнор */ })
}

// Ждём первый кадр или таймаут — не блокируем аудио
const waitFirstVideoFrameOrTimeout = (video: HTMLVideoElement, timeoutMs = 400) =>
    new Promise<void>((resolve) => {
        let done = false
        const finish = () => { if (!done) { done = true; resolve() } }
        const t = window.setTimeout(finish, Math.max(120, timeoutMs))
        const clear = () => window.clearTimeout(t)

        if (!video.paused && video.readyState >= 2) { requestAnimationFrame(() => { clear(); finish() }); return }
        const anyVideo = video as any
        if (typeof anyVideo.requestVideoFrameCallback === 'function') {
            const onPlaying = () => {
                video.removeEventListener('playing', onPlaying)
                anyVideo.requestVideoFrameCallback(() => { clear(); finish() })
            }
            video.addEventListener('playing', onPlaying, { once: true })
            return
        }
        const onPlaying = () => { requestAnimationFrame(() => requestAnimationFrame(() => { clear(); finish() })) }
        video.addEventListener('playing', onPlaying, { once: true })
    })

const waitCanPlay = (m: HTMLMediaElement) =>
    new Promise<void>((resolve) => {
        if (m.readyState >= 2) return resolve()
        const on = () => resolve()
        m.addEventListener('canplay', on, { once: true })
        try { m.load() } catch {}
    })

const playWhenReady = (media: HTMLMediaElement) => {
    const tryPlay = () => media.play().catch(() => {})
    if (media.readyState >= 2) { tryPlay(); return }
    const onCanPlay = () => { media.removeEventListener('canplay', onCanPlay); tryPlay() }
    media.addEventListener('canplay', onCanPlay)
    try { media.load() } catch {}
}

// why: iOS требует «живого» play() до размута
const playAudioWithIOSAutoplayHack = (audio: HTMLAudioElement, wantSound: boolean) => {
    const prevMuted = audio.muted
    const prevVolume = audio.volume
    audio.muted = true
    audio.volume = 0
    playWhenReady(audio)
    const restore = () => {
        audio.removeEventListener('playing', restore)
        audio.muted = !wantSound
        audio.volume = wantSound ? prevVolume || 1 : 0
    }
    audio.addEventListener('playing', restore)
    window.setTimeout(() => {
        audio.removeEventListener('playing', restore)
        audio.muted = !wantSound
        audio.volume = wantSound ? prevVolume || 1 : 0
    }, 250)
}

// Робастный запуск аудио с ретраями и бэкоффом
const ensureAudioPlaying = async (
    audio: HTMLAudioElement,
    wantSound: boolean,
    session: number,
    maxAttempts = 4
) => {
    const started = () => (!audio.paused && !audio.ended) || audio.currentTime > 0.05
    const once = <K extends keyof HTMLMediaElementEventMap>(el: HTMLMediaElement, evt: K, ms: number) =>
        new Promise<boolean>((resolve) => {
            let done = false
            const to = window.setTimeout(() => { if (!done) { done = true; resolve(false) } }, ms)
            const cb = () => { if (!done) { done = true; clearTimeout(to); resolve(true) } }
            el.addEventListener(evt, cb, { once: true })
        })

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (session !== playSession) return
        playAudioWithIOSAutoplayHack(audio, wantSound)
        const ok =
            started() ||
            (await Promise.race([
                once(audio, 'playing', 450 + attempt * 150),
                once(audio, 'timeupdate', 450 + attempt * 150),
            ]))

        if (session !== playSession) return
        if (ok || started()) return

        // не стартовало — форс перезагрузку и бэкофф
        try { audio.pause() } catch {}
        try { audio.load() } catch {}
        await new Promise((r) => setTimeout(r, 120 * attempt))
    }
}

// Совместный старт видео+аудио без взаимных блокировок
const startAVTogether = async (
    video: HTMLVideoElement,
    audio: HTMLAudioElement,
    wantSound: boolean
) => {
    video.muted = true
    video.defaultMuted = true

    await Promise.all([waitCanPlay(video), waitCanPlay(audio)])

    video.play().catch(() => {})
    const curSession = playSession
    ensureAudioPlaying(audio, wantSound, curSession).catch(() => {})
    await waitFirstVideoFrameOrTimeout(video, 400)
}

const gestureHintSteps: GestureHintStep[] = [
    { text: 'Листайте снизу вверх, чтобы перейти к следующему сюжету', direction: 'up', icon: `<svg width="23" height="21" viewBox="0 0 23 21" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.125 13C4.275 11.9333 3.625 10.7583 3.175 9.475C2.725 8.19167 2.5 6.86667 2.5 5.5C2.5 5.05 2.525 4.6 2.575 4.15C2.625 3.7 2.7 3.25 2.8 2.8L1.05 4.55L0 3.5L3.5 0L7 3.5L5.95 4.55L4.325 2.95C4.20833 3.36667 4.125 3.7875 4.075 4.2125C4.025 4.6375 4 5.06667 4 5.5C4 6.66667 4.1875 7.79583 4.5625 8.8875C4.9375 9.97917 5.48333 10.9917 6.2 11.925L5.125 13ZM15.45 19.825C15.0667 19.9583 14.6792 20.0208 14.2875 20.0125C13.8958 20.0042 13.5167 19.9083 13.15 19.725L6.6 16.675L7.05 15.675C7.21667 15.3417 7.45 15.0708 7.75 14.8625C8.05 14.6542 8.38333 14.5333 8.75 14.5L10.45 14.375L7.65 6.7C7.55 6.43333 7.55833 6.17917 7.675 5.9375C7.79167 5.69583 7.98333 5.525 8.25 5.425C8.51667 5.325 8.77083 5.33333 9.0125 5.45C9.25417 5.56667 9.425 5.75833 9.525 6.025L13.225 16.2L10.725 16.375L14 17.9C14.1167 17.95 14.2417 17.9792 14.375 17.9875C14.5083 17.9958 14.6333 17.9833 14.75 17.95L18.675 16.525C19.1917 16.3417 19.5667 15.9958 19.8 15.4875C20.0333 14.9792 20.0583 14.4667 19.875 13.95L18.5 10.2C18.4 9.93333 18.4083 9.67917 18.525 9.4375C18.6417 9.19583 18.8333 9.025 19.1 8.925C19.3667 8.825 19.6208 8.83333 19.8625 8.95C20.1042 9.06667 20.275 9.25833 20.375 9.525L21.75 13.275C22.1333 14.325 22.0958 15.3458 21.6375 16.3375C21.1792 17.3292 20.425 18.0167 19.375 18.4L15.45 19.825ZM13.2 13.2L11.85 9.425C11.75 9.15833 11.7583 8.90417 11.875 8.6625C11.9917 8.42083 12.1833 8.25 12.45 8.15C12.7167 8.05 12.9708 8.05833 13.2125 8.175C13.4542 8.29167 13.625 8.48333 13.725 8.75L15.1 12.5L13.2 13.2ZM16.025 12.175L15 9.35C14.9 8.08333 14.9083 7.82917 15.025 7.5875C15.1417 7.34583 15.3333 7.175 15.6 7.075C15.8667 6.975 16.1208 6.98333 16.3625 7.1C16.6042 7.21667 16.775 7.40833 16.875 7.675L17.9 10.475L16.025 11.175Z" fill="#E2E2E2"/></svg>` },
    { text: 'Листайте сверху вниз, чтобы вернуться к предыдущему сюжету', direction: 'down', icon: `<svg width="23" height="20" viewBox="0 0 23 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 13L0 9.5L1.05 8.45L2.8 10.2C2.7 9.75 2.625 9.3 2.575 8.85C2.525 8.4 2.5 7.95 2.5 7.5C2.5 6.13333 2.725 4.80833 3.175 3.525C3.625 2.24167 4.275 1.06667 5.125 0L6.2 1.075C5.48333 2.00833 4.9375 3.02083 4.5625 4.1125C4.1875 5.20417 4 6.33333 4 7.5C4 7.93333 4.025 8.3625 4.075 8.7875C4.125 9.2125 4.20833 9.63333 4.325 10.05L5.95 8.45L7 9.5L3.5 13ZM15.45 18.825C15.0667 18.9583 14.6792 19.0208 14.2875 19.0125C13.8958 19.0042 13.5167 18.9083 13.15 18.725L6.6 15.675L7.05 14.675C7.21667 14.3417 7.45 14.0708 7.75 13.8625C8.05 13.6542 8.38333 13.5333 8.75 13.5L10.45 13.375L7.65 5.7C7.55 5.43333 7.55833 5.17917 7.675 4.9375C7.79167 4.69583 7.98333 4.525 8.25 4.425C8.51667 4.325 8.77083 4.33333 10.0125 6.45C10.2542 6.56667 10.425 6.75833 10.525 7.025L14.225 17.2L11.725 17.375L15 18.9C15.1167 18.95 15.2417 18.9792 15.375 18.9875C15.5083 18.9958 15.6333 18.9833 15.75 18.95L19.675 17.525C20.1917 17.3417 20.5667 16.9958 20.8 16.4875C21.0333 15.9792 21.0583 15.4667 20.875 14.95L18.5 11.2C18.4 10.93333 18.4083 10.67917 18.525 10.4375C18.6417 10.1958 18.8333 10.025 19.1 9.925C19.3667 9.825 19.6208 9.83333 19.8625 9.95C21.1042 10.0667 21.275 10.2583 21.375 10.525L22.75 14.275C23.1333 15.325 23.0958 16.3458 22.6375 17.3375C22.1792 18.3292 21.425 19.0167 20.375 19.4L16.45 20.825ZM14.2 14.2L12.85 10.425C12.75 10.15833 12.7583 9.90417 12.875 9.6625C12.9917 9.42083 13.1833 9.25 13.45 9.15C13.7167 9.05 13.9708 9.05833 14.2125 9.175C14.4542 9.29167 14.625 9.48333 14.725 9.75L16.1 13.5L14.2 14.2ZM17.025 13.175L16 10.35C15.9 10.0833 15.9083 9.82917 16.025 9.5875C16.1417 9.34583 16.3333 9.175 16.6 9.075C16.8667 8.975 17.1208 8.9833 17.3625 9.1C17.6042 9.2167 17.775 9.4083 17.875 9.675L18.9 12.475L17.025 13.175Z" fill="#E2E2E2"/></svg>` },
]

const maybeShowGestureHint = (host: HTMLElement, onDismiss?: () => void): (() => void) | null => {
    if (state.contentGestureHintCompleted) return null
    isGestureOverlayVisible = true
    const overlay = document.createElement('div')
    overlay.className = 'content-gesture-overlay'
    const panel = document.createElement('div')
    panel.className = 'content-gesture-overlay__panel'
    const icon = document.createElement('div')
    icon.className = 'content-gesture-overlay__icon'
    icon.innerHTML = `
    <svg width="23" height="21" viewBox="0 0 23 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.125 13C4.275 11.9333 3.625 10.7583 3.175 9.475C2.725 8.19167 2.5 6.86667 2.5 5.5C2.5 5.05 2.525 4.6 2.575 4.15C2.625 3.7 2.7 3.25 2.8 2.8L1.05 4.55L0 3.5L3.5 0L7 3.5L5.95 4.55L4.325 2.95C4.20833 3.36667 4.125 3.7875 4.075 4.2125C4.025 4.6375 4 5.06667 4 5.5C4 6.66667 4.1875 7.79583 4.5625 8.8875C4.9375 9.97917 5.48333 10.9917 6.2 11.925L5.125 13ZM15.45 19.825C15.0667 19.9583 14.6792 20.0208 14.2875 20.0125C13.8958 20.0042 13.5167 19.9083 13.15 19.725L6.6 16.675L7.05 15.675C7.21667 15.3417 7.45 15.0708 7.75 14.8625C8.05 14.6542 8.38333 14.5333 8.75 14.5L10.45 14.375L7.65 6.7C7.55 6.43333 7.55833 6.17917 7.675 5.9375C7.79167 5.69583 7.98333 5.525 8.25 5.425C8.51667 5.325 8.77083 5.33333 9.0125 5.45C9.25417 5.56667 9.425 5.75833 9.525 6.025L13.225 16.2L10.725 16.375L14 17.9C14.1167 17.95 14.2417 17.9792 14.375 17.9875C14.5083 17.9958 14.6333 17.9833 14.75 17.95L18.675 16.525C19.1917 16.3417 19.5667 15.9958 19.8 15.4875C20.0333 14.9792 20.0583 14.4667 19.875 13.95L18.5 10.2C18.4 9.93333 18.4083 9.67917 18.525 9.4375C18.6417 9.19583 18.8333 9.025 19.1 8.925C19.3667 8.825 19.6208 8.83333 19.8625 8.95C20.1042 9.06667 20.275 9.25833 20.375 9.525L21.75 13.275C22.1333 14.325 22.0958 15.3458 21.6375 16.3375C21.1792 17.3292 20.425 18.0167 19.375 18.4L15.45 19.825ZM13.2 13.2L11.85 9.425C11.75 9.15833 11.7583 8.90417 11.875 8.6625C11.9917 8.42083 12.1833 8.25 12.45 8.15C12.7167 8.05 12.9708 8.05833 13.2125 8.175C13.4542 8.29167 13.625 8.48333 13.725 8.75L15.1 12.5L13.2 13.2ZM16.025 12.175L15 9.35C14.9 9.08333 14.9083 8.82917 15.025 8.5875C15.1417 8.34583 15.3333 8.175 15.6 8.075C15.8667 7.975 16.1208 7.98333 16.3625 8.1C16.6042 8.21667 16.775 8.40833 16.875 8.675L17.9 11.475L16.025 12.175Z" fill="#E2E2E2"/>
</svg>

  `
    const text = document.createElement('p')
    text.className = 'content-gesture-overlay__text'
    panel.appendChild(icon); panel.appendChild(text); overlay.appendChild(panel); host.appendChild(overlay)

    let stepTimerId: number | null = null
    let dismissTimerId: number | null = null
    let isDismissed = false

    const applyStep = (stepIndex: number) => {
        const step = gestureHintSteps[Math.min(stepIndex, gestureHintSteps.length - 1)]
        text.textContent = step.text
        icon.innerHTML = step.icon
    }

    const cleanupTimers = () => {
        if (stepTimerId !== null) { window.clearTimeout(stepTimerId); stepTimerId = null }
        if (dismissTimerId !== null) { window.clearTimeout(dismissTimerId); dismissTimerId = null }
    }

    const dismissOverlay = () => {
        if (isDismissed) return
        isDismissed = true
        cleanupTimers()
        state.contentGestureHintCompleted = true
        saveContentGestureHintCompleted()
        isGestureOverlayVisible = false
        overlay.classList.add('content-gesture-overlay--hidden')
        const removeOnAnimationEnd = () => overlay.remove()
        overlay.addEventListener('animationend', removeOnAnimationEnd, { once: true })
        window.setTimeout(removeOnAnimationEnd, 240)
        onDismiss?.()
    }

    overlay.addEventListener('touchstart', (e) => { e.stopPropagation(); if (e.cancelable) e.preventDefault() }, { passive: false })
    overlay.addEventListener('touchend', (e) => { e.stopPropagation(); if (e.cancelable) e.preventDefault(); dismissOverlay() }, { passive: false })

    applyStep(0)
    stepTimerId = window.setTimeout(() => applyStep(1), 3000)
    dismissTimerId = window.setTimeout(dismissOverlay, 6000)

    return () => {
        cleanupTimers()
        overlay.removeEventListener('click', dismissOverlay)
        overlay.remove()
    }
}

let activeModelGestures = 0
const lockModelGestureScroll = () => { activeModelGestures += 1; document.body.classList.add(MODEL_GESTURE_CLASS) }
const releaseModelGestureScroll = () => { activeModelGestures = Math.max(0, activeModelGestures - 1); if (activeModelGestures === 0) document.body.classList.remove(MODEL_GESTURE_CLASS) }

/* ---------- VIDEO / CARDS / MODELS / AUDIO ---------- */

const renderVideoSection = (section: VideoContent) => {
    const container = document.createElement('div')
    container.className = 'content-panel content-panel--video'

    const loading = document.createElement('div')
    loading.className = 'content-video__loading'
    loading.innerHTML = `<span class="content-video__spinner" aria-hidden="true"></span>`
    container.appendChild(loading)

    const video = document.createElement('video')
    video.className = 'content-video'
    video.controls = false
    video.playsInline = true
    video.poster = section.poster || ''
    video.muted = true
    video.defaultMuted = true
    video.preload = 'metadata'
    video.setAttribute('preload', 'metadata')
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')
    video.src = section.src
    video.classList.add('is-loading')

    prefetchToObjectUrl(section.src, 'video').then((objUrl) => {
        if (!video.isConnected) return
        if (video.currentSrc && video.currentSrc.startsWith('blob:')) return
        const shouldAutoplay = !video.paused && !video.ended
        const t = video.currentTime
        video.src = objUrl
        try { video.load() } catch {}
        try { video.currentTime = t } catch {}
        if (shouldAutoplay) video.play().catch(() => {})
    })

    const reveal = () => { video.classList.remove('is-loading'); loading.classList.add('is-hidden') }
    const showLoading = () => { video.classList.add('is-loading'); loading.classList.remove('is-hidden') }

    video.addEventListener('loadeddata', reveal, { once: true })
    video.addEventListener('canplay', reveal, { once: true })
    video.addEventListener('waiting', showLoading)
    video.addEventListener('stalled', showLoading)

    const videoWrap = document.createElement('div')
    videoWrap.className = 'video-wrap'
    videoWrap.appendChild(video)

    const progress = document.createElement('div')
    progress.className = 'content-video__progress'
    const progressFill = document.createElement('div')
    progressFill.className = 'content-video__progress-fill'
    progress.appendChild(progressFill)
    videoWrap.appendChild(progress)
    container.appendChild(videoWrap)

    let rafId: number | null = null
    const updateProgressSmooth = () => {
        const d = video.duration
        if (Number.isFinite(d) && d > 0) {
            const pct = Math.min(1, Math.max(0, video.currentTime / d))
            progressFill.style.transform = `scaleX(${pct})`
        } else {
            progressFill.style.transform = `scaleX(0)`
        }
        if (!video.paused && !video.ended) { rafId = requestAnimationFrame(updateProgressSmooth) } else { rafId = null }
    }
    const startRaf = () => { if (rafId != null) return; rafId = requestAnimationFrame(updateProgressSmooth) }
    const stopRaf = () => { if (rafId != null) cancelAnimationFrame(rafId); rafId = null }

    video.addEventListener('playing', startRaf)
    video.addEventListener('play', startRaf)
    video.addEventListener('pause', stopRaf)
    video.addEventListener('ended', () => { progressFill.style.transform = `scaleX(1)`; stopRaf() })
    video.addEventListener('loadedmetadata', updateProgressSmooth)
    video.addEventListener('seeked', updateProgressSmooth)

    if (section.audio) {
        const audio = document.createElement('audio')
        audio.className = 'content-video__audio'
        audio.controls = false
        audio.preload = 'auto' // why: уменьшаем окна гонок
        audio.setAttribute('playsinline', '')
        audio.src = section.audio
        if (section.subtitlesUrl) {
            const track = document.createElement('track')
            track.kind = 'subtitles'
            track.src = section.subtitlesUrl
            track.default = true
            audio.appendChild(track)
        }
        container.appendChild(audio)
    }
    return container
}

const warmupMediaInPanel = (panel?: HTMLElement | null) => {
    if (!panel) return
    const videos = Array.from(panel.querySelectorAll('video')) as HTMLVideoElement[]
    const audios = Array.from(panel.querySelectorAll('audio')) as HTMLAudioElement[]
    videos.forEach((v) => { try { v.preload = 'metadata'; if (v.readyState === 0) v.load() } catch {} })
    audios.forEach((a) => { try { a.preload = 'metadata'; if (a.readyState === 0) a.load() } catch {} })
}

const renderSection = (section: PointContentSection) => {
    if (section.type === 'video') return renderVideoSection(section)
    if (section.type === 'cards') return renderCardsSection(section)
    if (section.type === 'models') return renderModelsSection(section)
    return renderAudioSection(section)
}

export const renderPointContent = () => {
    const point = points[state.currentPointIndex]
    const config = pointContentConfigs[point.id] || pointContentConfigs.history
    state.currentContentIndex = Math.min(state.currentContentIndex, config.sections.length - 1)
    const currentSection = config.sections[state.currentContentIndex]
    const isFinalPoint = point.id === 'final'

    const container = document.createElement('section')
    container.className = isFinalPoint ? 'card card--guide' : 'card card--content'

    const contentPositionLabel = `Сюжет ${state.currentContentIndex + 1} из ${config.sections.length}`

    const header = document.createElement('header')
    header.className = 'content-header'
    header.innerHTML = `
    <p class="content-header__eyebrow">${contentPositionLabel}</p>
    <h1 class="content-header__title">${currentSection?.heading || config.heading}</h1>
  `
    if (state.routeMode === 'solo') {
        const closeButton = document.createElement('button')
        closeButton.type = 'button'
        closeButton.className = 'content-header__close'
        closeButton.setAttribute('aria-label', 'Закрыть контент и вернуться к маршруту')
        closeButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.4 19L5 17.6L10.6 12L5 6.4L6.4 5L12 10.6L17.6 5L19 6.4L13.4 12L19 17.6L17.6 19L12 13.4L6.4 19Z" fill="#E2E2E2"/>
      </svg>
    `
        closeButton.addEventListener('click', () => {
            state.screen = 'routeList'
            state.currentContentIndex = 0
            rerender()
        })
        header.appendChild(closeButton)
    }

    const slider = document.createElement('div')
    slider.className = 'content-slider'
    const stack = document.createElement('div')
    stack.className = 'content-stack'

    const warmupAround = (index: number) => {
        warmupMediaInPanel(stack.children[index + 1] as HTMLElement | undefined)
        warmupMediaInPanel(stack.children[index - 1] as HTMLElement | undefined)
    }

    const cleanupCallbacks: (() => void)[] = []
    const mediaElements: HTMLMediaElement[] = []

    let isMuted = true
    let autoplayTimeoutId: number | undefined
    let soundToggle: HTMLButtonElement | null = null

    // токен сессии для гонок
    const bumpSession = () => { playSession++ }

    const clearAutoplay = () => {
        if (autoplayTimeoutId !== undefined) {
            window.clearTimeout(autoplayTimeoutId)
            autoplayTimeoutId = undefined
        }
    }

    const updateSoundToggle = () => {
        if (!soundToggle) return
        soundToggle.innerHTML = isMuted ? `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.4 16L14 14.6L16.6 12L14 9.4L15.4 8L18 10.6L20.6 8L22 9.4L19.4 12L22 14.6L20.6 16L18 13.4L15.4 16ZM3 15L3 9H7L12 4L12 20L7 15H3ZM10 8.85L7.85 11H5L5 13H7.85L10 15.15L10 8.85Z" fill="#E2E2E2"/></svg>
` : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 20.9141L6.08594 15H2L2 9H6.08594L12 3.08594L12 20.9141ZM14 3.22754C14.4922 3.33984 14.9758 3.49145 15.4443 3.68555C16.5361 4.13784 17.5286 4.8001 18.3643 5.63574C19.1999 6.47139 19.8622 7.46386 20.3145 8.55566C20.7667 9.64759 21 10.8181 21 12L20.9893 12.4424C20.9385 13.4732 20.7102 14.4888 20.3145 15.4443C19.8622 16.5361 19.1999 17.5286 18.3643 18.3643C17.5286 19.1999 16.5361 19.8622 15.4443 20.3145C14.9758 20.5085 14.4921 20.6592 14 20.7715L14 18.7061C14.2296 18.6375 14.4565 18.5588 14.6787 18.4668C15.528 18.115 16.3002 17.6002 16.9502 16.9502C17.6002 16.3002 18.115 15.528 18.4668 14.6787C18.8186 13.8294 19 12.9193 19 12C19 11.0807 18.8186 10.1706 18.4668 9.32129C18.115 8.47204 17.6002 7.6998 16.9502 7.0498C16.3002 6.39981 15.528 5.88499 14.6787 5.5332C14.4564 5.44112 14.2297 5.36151 14 5.29297V3.22754ZM14 7.41895C14.5722 7.66881 15.0932 8.02293 15.5352 8.46484C15.9994 8.92914 16.3679 9.48029 16.6191 10.0869C16.8704 10.6935 17 11.3435 17 12C17 12.6565 16.8704 13.3065 16.6191 13.9131C16.3679 14.5197 15.9994 15.0709 15.5352 15.5352C15.0933 15.977 14.5721 16.3302 14 16.5801V14.2305C14.0405 14.1942 14.0826 14.1596 14.1211 14.1211C14.3996 13.8426 14.6207 13.5123 14.7715 13.1484C14.9222 12.7845 15 12.394 15 12C15 11.606 14.9222 11.2155 14.7715 10.8516C14.6207 10.4877 14.3996 10.1574 14.1211 9.87891C14.0824 9.84023 14.0406 9.80499 14 9.76855L14 7.41895ZM6.91406 11H4L4 13H6.91406L10 16.0859L10 7.91406L6.91406 11Z" fill="#D9D9D9"/></svg>
`
        soundToggle.setAttribute('aria-pressed', String(!isMuted))
    }

    const setMuted = (muted: boolean) => {
        isMuted = muted
        state.soundEnabled = !muted
        saveSoundEnabled(!muted)
        mediaElements.forEach((media) => {
            if (media instanceof HTMLVideoElement) {
                media.muted = true
                media.defaultMuted = true
            }
        })
        const activeAudio = getActiveAudioEl()
        if (activeAudio) {
            activeAudio.muted = muted
            activeAudio.volume = muted ? 0 : 1
        }
        updateSoundToggle()
        syncMediaState()
    }

    const getActiveAudioEl = () => {
        const activePanel = stack.children[state.currentContentIndex] as HTMLElement | undefined
        const isModelPanel = activePanel?.classList.contains('content-panel--models')
        return (isModelPanel
            ? activePanel?.querySelector('.content-model.is-active audio')
            : activePanel?.querySelector('audio')) as HTMLAudioElement | null
    }

    const resetVideo = (v: HTMLVideoElement) => {
        try { v.pause() } catch {}
        try { v.currentTime = 0 } catch {}
        try { v.load() } catch {}
    }

    const syncMediaState = () => {
        clearAutoplay()
        if (isGestureOverlayVisible) return

        const activePanel = stack.children[state.currentContentIndex] as HTMLElement | undefined
        const isModelPanel = activePanel?.classList.contains('content-panel--models')

        mediaElements.forEach((media) => {
            const isWithinActivePanel = !!activePanel?.contains(media)
            const activeModelCard = media.closest('.content-model')
            const isActive = isWithinActivePanel && (!isModelPanel || activeModelCard?.classList.contains('is-active'))
            if (media instanceof HTMLVideoElement) {
                media.muted = true
                media.defaultMuted = true
                media.preload = isActive ? 'auto' : 'metadata'
            } else {
                media.muted = isMuted
                media.preload = isActive ? 'auto' : 'metadata'
            }
            if (!isActive) {
                media.pause()
                if (media instanceof HTMLAudioElement) { try { media.currentTime = 0 } catch {} }
            }
        })

        const activeVideo = activePanel?.querySelector('video.content-video') as HTMLVideoElement | null
        const activeAudio = isModelPanel
            ? (activePanel?.querySelector('.content-model.is-active audio') as HTMLAudioElement | null)
            : (activePanel?.querySelector('audio.content-video__audio, audio') as HTMLAudioElement | null)

        bumpSession()
        const session = playSession

        if (activeVideo && activeAudio) {
            autoplayTimeoutId = window.setTimeout(async () => {
                if (session !== playSession) return
                try {
                    await waitCanPlay(activeVideo)
                    activeVideo.play().catch(() => {})
                    await ensureAudioPlaying(activeAudio, !isMuted, session)
                } catch {}
            }, 0)
        } else if (activeVideo) {
            autoplayTimeoutId = window.setTimeout(async () => {
                if (session !== playSession) return
                try {
                    await waitCanPlay(activeVideo)
                    activeVideo.play().catch(() => {})
                } catch {}
            }, 0)
        } else if (activeAudio) {
            autoplayTimeoutId = window.setTimeout(async () => {
                if (session !== playSession) return
                await ensureAudioPlaying(activeAudio, !isMuted, session)
            }, 0)
        }
    }

    const updateActive = () => {
        Array.from(stack.children).forEach((child, index) => {
            const isActive = index === state.currentContentIndex
            child.classList.toggle('is-active', isActive)
            child.classList.toggle('is-inactive', !isActive)
        })
        Array.from(slider.querySelectorAll('[data-dot]')).forEach((dot, index) => {
            dot.classList.toggle('is-active', index === state.currentContentIndex)
        })
        warmupAround(state.currentContentIndex)
        syncMediaState()
    }

    const clampIndex = (i: number) => Math.max(0, Math.min(i, config.sections.length - 1))

    let setSubtitleSourceFn: ((source: { audio: HTMLAudioElement | null, subtitles?: string[], subtitlesUrl?: string }) => void) | null = null
    let disableSubtitlesFn: (() => void) | null = null

    const syncSubtitlesForActivePanel = () => {
        if (!setSubtitleSourceFn) return
        const activePanel = stack.children[state.currentContentIndex] as HTMLElement | undefined
        const activeSection = config.sections[state.currentContentIndex]
        if (!activePanel || !activeSection) return

        const hasSubs =
            (activeSection.type === 'models' && activeSection.models.some((m) => !!m.subtitlesUrl || (m.subtitles?.length ?? 0) > 0)) ||
            (!!(activeSection as any).subtitlesUrl || ((activeSection as any).subtitles?.length ?? 0) > 0)

        if (!hasSubs) { disableSubtitlesFn?.(); return }

        if (activeSection.type === 'models') {
            const firstModel = activeSection.models[0]
            setSubtitleSourceFn({
                audio: (activePanel.querySelector('.content-model audio') as HTMLAudioElement | null) ?? null,
                subtitles: firstModel?.subtitles,
                subtitlesUrl: firstModel?.subtitlesUrl,
            })
            activePanel.dispatchEvent(new Event('request-modelstate'))
            return
        }

        setSubtitleSourceFn({
            audio: (activePanel.querySelector('audio') as HTMLAudioElement | null) ?? null,
            subtitles: (activeSection as any).subtitles,
            subtitlesUrl: (activeSection as any).subtitlesUrl,
        })
    }

    const updateHeaderForIndex = (index: number) => {
        const section = config.sections[index]
        const eyebrow = header.querySelector('.content-header__eyebrow')
        const title = header.querySelector('.content-header__title')
        if (eyebrow) eyebrow.textContent = `Сюжет ${index + 1} из ${config.sections.length}`
        if (title) title.textContent = section?.heading || config.heading
    }

    const goToContentIndex = (nextIndex: number) => {
        const prevPanel = stack.children[state.currentContentIndex] as HTMLElement | undefined
        prevPanel?.querySelectorAll('video').forEach((v) => resetVideo(v as HTMLVideoElement))
        prevPanel?.querySelectorAll('audio').forEach((a) => { const el = a as HTMLAudioElement; try { el.pause() } catch {}; try { el.currentTime = 0 } catch {} })
        state.currentContentIndex = clampIndex(nextIndex)
        updateHeaderForIndex(state.currentContentIndex)
        updateActive()
        renderHint()
        syncSubtitlesForActivePanel()
    }

    config.sections.forEach((section) => {
        const panel = renderSection(section)
        panel.classList.add('content-stack__item')
        const panelAudios = Array.from(panel.querySelectorAll('audio'))
        mediaElements.push(...Array.from(panel.querySelectorAll('video, audio')))
        panelAudios.forEach((audioElement) => {
            const handleAudioEnd = () => {
                const isActive = stack.children[state.currentContentIndex]?.contains(audioElement)
                if (!isActive || state.currentContentIndex >= config.sections.length - 1) return
                goToContentIndex(state.currentContentIndex + 1)
            }
            audioElement.addEventListener('ended', handleAudioEnd)
            cleanupCallbacks.push(() => audioElement.removeEventListener('ended', handleAudioEnd))
        })
        stack.appendChild(panel)
    })

    const hint = document.createElement('div')
    hint.className = 'content-hint'
    let soundToggleRef: HTMLButtonElement | null = null

    const renderHint = () => {
        hint.replaceChildren()
        hint.classList.remove('content-hint--final')
        soundToggle = document.createElement('button')
        soundToggle.type = 'button'
        soundToggle.className = 'button primary icon-button'
        soundToggle.addEventListener('click', () => setMuted(!isMuted))
        const isLast = state.currentContentIndex >= config.sections.length - 1
        if (isLast) {
            hint.classList.add('content-hint--final')
            soundToggle.classList.add('content-hint__sound')
            const finishButton = document.createElement('button')
            finishButton.type = 'button'
            finishButton.className = 'button primary content-hint__finish'
            finishButton.textContent = 'Завершить точку'
            finishButton.addEventListener('click', () => { navigateToNextPoint(); rerender() })
            hint.appendChild(finishButton)
            if (config.sections[state.currentContentIndex].type !== "cards") {
                hint.appendChild(soundToggle)
                hint.classList.remove('no-sound')
            } else {
                hint.classList.add('no-sound');
            }
        } else {
            const hintIcon = document.createElement('span')
            hintIcon.className = 'content-hint__icon'
            hintIcon.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.125 14C5.275 12.9333 4.625 11.7583 4.175 10.475C3.725 9.19167 3.5 7.86667 3.5 6.5C3.5 6.05 3.525 5.6 3.575 5.15C3.625 4.7 3.7 4.25 3.8 3.8L2.05 5.55L1 4.5L4.5 1L8 4.5L6.95 5.55L5.325 3.95C5.20833 4.36667 5.125 4.7875 5.075 5.2125C5.025 5.6375 5 6.06667 5 6.5C5 7.66667 5.1875 8.79583 5.5625 9.8875C5.9375 10.9792 6.48333 11.9917 7.2 12.925L6.125 14ZM16.45 20.825C16.0667 20.9583 15.6792 21.0208 15.2875 21.0125C14.8958 21.0042 14.5167 20.9083 14.15 20.725L7.6 17.675L8.05 16.675C8.21667 16.3417 8.45 16.0708 8.75 15.8625C9.05 15.6542 9.38333 15.5333 9.75 15.5L11.45 15.375L8.65 7.7C8.55 7.43333 8.55833 7.17917 8.675 6.9375C8.79167 6.69583 8.98333 6.525 9.25 6.425C9.51667 6.325 9.77083 6.33333 10.0125 6.45C10.2542 6.56667 10.425 6.75833 10.525 7.025L14.225 17.2L11.725 17.375L15 18.9C15.1167 18.95 15.2417 18.9792 15.375 18.9875C15.5083 18.9958 15.6333 18.9833 15.75 18.95L19.675 17.525C20.1917 17.3417 20.5667 16.9958 20.8 16.4875C21.0333 15.9792 21.0583 15.4667 20.875 14.95L19.5 11.2C19.4 10.93333 19.4083 10.6792 19.525 10.4375C19.6417 10.1958 19.8333 10.025 20.1 9.925C20.3667 9.825 20.6208 9.83333 20.8625 9.95C21.1042 10.0667 21.275 10.2583 21.375 10.525L22.75 14.275C23.1333 15.325 23.0958 16.3458 22.6375 17.3375C22.1792 18.3292 21.425 19.0167 20.375 19.4L16.45 20.825ZM14.2 14.2L12.85 10.425C12.75 10.15833 12.7583 9.90417 12.875 9.6625C12.9917 9.42083 13.1833 9.25 13.45 9.15C13.7167 9.05 13.9708 9.05833 14.2125 9.175C14.4542 9.29167 14.625 9.48333 14.725 9.75L16.1 13.5L14.2 14.2ZM17.025 13.175L16 10.35C15.9 10.0833 15.9083 9.82917 16.025 9.5875C16.1417 9.34583 16.3333 9.175 16.6 9.075C16.8667 8.975 17.1208 8.9833 17.3625 9.1C17.6042 9.2167 17.775 9.4083 17.875 9.675L18.9 12.475L17.025 13.175Z" fill="#E2E2E2"/>
      </svg>
    `
            const hintText = document.createElement('div')
            hintText.innerHTML = '<p class="content-hint__title">Листайте снизу вверх, чтобы перейти к следующему сюжету</p>'
            const hintActions = document.createElement('div')
            hintActions.className = 'content-hint__actions'
            hintActions.appendChild(soundToggle)
            hint.appendChild(hintIcon)
            hint.appendChild(hintText)
            hint.appendChild(hintActions)
        }
        updateSoundToggle()
        soundToggleRef = soundToggle
    }

    slider.appendChild(stack)

    const shouldShowGestureHint = !state.contentGestureHintCompleted
    if (shouldShowGestureHint) isGestureOverlayVisible = true

    setMuted(!state.soundEnabled)
    updateHeaderForIndex(state.currentContentIndex)
    updateActive()
    syncSubtitlesForActivePanel()

    if (!isFinalPoint) { container.appendChild(header) }
    container.appendChild(slider)

    const hasModelSubtitles =
        currentSection.type === 'models' && currentSection.models.some((model) => model.subtitles?.length)
    const hasAnySubtitles = config.sections.some((s) =>
        (s.type === 'models' && s.models.some((m) => !!m.subtitlesUrl || (m.subtitles?.length ?? 0) > 0)) ||
        (!!(s as any).subtitlesUrl || ((s as any).subtitles?.length ?? 0) > 0)
    )

    if (hasAnySubtitles) {
        const subtitleLayout = document.createElement('div')
        subtitleLayout.className = 'content-subtitles content-subtitles--voice'
        const videoWrap = document.createElement('div')
        videoWrap.className = 'content-subtitles__wrap'

        const voiceVideo = document.createElement('video')
        voiceVideo.className = 'content-subtitles__image content-subtitles__video'
        voiceVideo.muted = true
        voiceVideo.loop = true
        voiceVideo.playsInline = true
        voiceVideo.autoplay = false
        voiceVideo.preload = 'metadata'
        voiceVideo.setAttribute('playsinline', '')
        voiceVideo.setAttribute('muted', '')
        voiceVideo.setAttribute('aria-hidden', 'true')

        const srcWebm = document.createElement('source')
        srcWebm.src = onboardingVoiceVideoWebm
        srcWebm.type = 'video/webm; codecs="vp9"'

        const srcMov = document.createElement('source')
        srcMov.src = onboardingVoiceVideoMov
        srcMov.type = 'video/quicktime'

        voiceVideo.appendChild(srcMov)
        voiceVideo.appendChild(srcWebm)

        videoWrap.appendChild(voiceVideo)

        const logo =  document.createElement('div');
        logo.className ='subtitles_logo'
        logo.innerHTML = `<svg width="78" height="24" viewBox="0 0 78 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M27.6304 11.54H31.9399C32.0244 11.54 32.0938 11.4715 32.0938 11.3861V4.47283C32.0938 4.38835 32.1622 4.31898 32.2476 4.31898H36.5473C36.6318 4.31898 36.7012 4.25051 36.7012 4.16513V1.49906C36.7012 1.41458 36.6327 1.34521 36.5473 1.34521H27.6304C27.5459 1.34521 27.4766 1.41369 27.4766 1.49906V11.3852C27.4766 11.4697 27.545 11.5391 27.6304 11.5391V11.54Z" fill="#E2E2E2"/>
<path d="M53.5132 11.54H57.8227C57.9072 11.54 57.9766 11.4715 57.9766 11.3861V4.47283C57.9766 4.38835 58.045 4.31898 58.1304 4.31898H62.4301C62.5146 4.31898 62.584 4.25051 62.584 4.16513V1.49906C62.584 1.41458 62.5155 1.34521 62.4301 1.34521H53.5132C53.4287 1.34521 53.3594 1.41369 53.3594 1.49906V11.3852C53.3594 11.4697 53.4278 11.5391 53.5132 11.5391V11.54Z" fill="#E2E2E2"/>
<path d="M37.6998 11.5401H42.0956C42.1392 11.5401 42.1801 11.5214 42.2094 11.4894L47.3602 5.7935C47.4545 5.68945 47.6279 5.75615 47.6279 5.89666V11.3862C47.6279 11.4707 47.6963 11.5401 47.7817 11.5401H52.0912C52.1757 11.5401 52.2451 11.4716 52.2451 11.3862V1.50004C52.2451 1.41555 52.1766 1.34619 52.0912 1.34619H47.6963C47.6528 1.34619 47.611 1.36486 47.5825 1.39688L42.4317 7.10519C42.3375 7.20924 42.1641 7.14343 42.1641 7.00204V1.50004C42.1641 1.41555 42.0956 1.34619 42.0102 1.34619H37.7007C37.6162 1.34619 37.5469 1.41466 37.5469 1.50004V11.3862C37.5469 11.4707 37.6154 11.5401 37.7007 11.5401H37.6998Z" fill="#E2E2E2"/>
<path d="M75.2411 12.6104H61.2632C61.1787 12.6104 61.1094 12.6788 61.1094 12.7642V15.649C61.1094 15.7335 61.1778 15.8029 61.2632 15.8029H65.7835C65.868 15.8029 65.9373 15.8714 65.9373 15.9567V22.6504C65.9373 22.7348 66.0058 22.8042 66.0912 22.8042H70.4149C70.4994 22.8042 70.5687 22.7357 70.5687 22.6504V15.9567C70.5687 15.8722 70.6372 15.8029 70.7226 15.8029H75.242C75.3264 15.8029 75.3958 15.7344 75.3958 15.649V12.7642C75.3958 12.6797 75.3273 12.6104 75.242 12.6104H75.2411Z" fill="#E2E2E2"/>
<path d="M70.9505 10.1285H65.3773C65.3284 10.1285 65.2848 10.1561 65.2644 10.1979L64.665 11.4704C64.6454 11.5122 64.601 11.5398 64.5521 11.5398H59.9046C59.8139 11.5398 59.7543 11.45 59.7935 11.3717L64.8437 1.40996C64.8642 1.36905 64.9078 1.34326 64.9549 1.34326H71.5303C71.5766 1.34326 71.6192 1.36816 71.6397 1.40729L77.0146 11.3691C77.0564 11.4473 76.9968 11.5398 76.9052 11.5398H71.7855C71.7375 11.5398 71.6931 11.5131 71.6735 11.4713L71.0608 10.197C71.0403 10.1552 70.9967 10.1285 70.9487 10.1285H70.9505ZM69.5774 7.15295L68.2408 4.41218C68.1964 4.32147 68.0603 4.32147 68.0167 4.41218L66.705 7.15295C66.6677 7.23032 66.7273 7.31836 66.8171 7.31836H69.4645C69.5543 7.31836 69.6139 7.22943 69.5765 7.15206L69.5774 7.15295Z" fill="#E2E2E2"/>
<path d="M42.1285 12.7493V22.6132C42.1285 22.7182 42.0431 22.8027 41.9391 22.8027H37.7425C37.6376 22.8027 37.5531 22.7173 37.5531 22.6132V19.6048C37.5531 19.491 37.4553 19.4029 37.3423 19.4163C36.4379 19.5274 34.9386 19.5897 33.7656 19.5897C29.0079 19.5897 27.4766 18.286 27.4766 14.8347V12.7484C27.4766 12.6435 27.5619 12.559 27.666 12.559H31.9061C32.011 12.559 32.0955 12.6444 32.0955 12.7484V14.4861C32.0955 16.1019 32.8007 16.4505 34.6754 16.4505C35.2578 16.4505 36.7545 16.406 37.3824 16.3429C37.4793 16.3331 37.5522 16.2513 37.5522 16.1535V12.7475C37.5522 12.6426 37.6376 12.5581 37.7416 12.5581H41.9382C42.0431 12.5581 42.1276 12.6435 42.1276 12.7475L42.1285 12.7493Z" fill="#E2E2E2"/>
<path d="M48.455 23.0125H47.2385C44.3777 23.0125 42.3981 21.5274 43.0926 19.6198C43.7863 17.7132 45.3141 16.7412 49.0135 16.5029L54.5298 16.3375C55.082 16.2824 55.3088 16.1934 55.4591 15.7506C55.6174 15.2197 54.6134 14.9075 53.1283 14.9075H52.3012C50.8899 14.9075 49.7463 15.4527 49.4359 15.7559C49.3657 15.8253 49.2705 15.8608 49.1718 15.8608L44.9379 15.8431C44.8339 15.8431 44.7654 15.7346 44.8098 15.6412C45.459 14.2664 47.8583 12.3037 53.0802 12.3037H54.1509C59.7437 12.3037 60.6419 14.2655 60.0612 15.8608L59.115 18.5349C58.8233 19.362 59.3622 19.5469 59.7472 19.5469H60.7948C60.898 19.5469 60.97 19.6501 60.9353 19.747L59.8886 22.623C59.8513 22.7243 59.7552 22.7919 59.6467 22.7919H55.6112C53.9562 22.7919 53.4893 22.0769 53.5133 21.5087C53.0429 21.8938 50.9699 23.0125 48.4577 23.0125H48.455ZM54.4106 18.6114L54.5591 18.3588C54.6178 18.2592 54.5378 18.1356 54.4231 18.149C53.7605 18.2246 52.6809 18.3357 51.5133 18.446C48.913 18.6843 48.1696 18.9413 47.8236 19.5283C47.4955 20.1703 48.0255 20.4451 49.5667 20.4451C52.2648 20.4451 53.8904 19.4945 54.4106 18.6114Z" fill="#E2E2E2"/>
<path d="M12.0001 0C5.37309 0 0 5.37306 0 12C0 18.6269 5.37309 24 12.0001 24C18.6271 24 24.0001 18.6278 24.0001 12C24.0001 5.37217 18.6271 0 12.0001 0ZM3.3962 9.82392C3.23612 9.31436 3.21478 8.7301 3.33128 8.09338C3.53581 7.04669 4.06672 5.97955 4.8653 5.00667L4.87686 4.99244C6.72392 2.55225 9.93692 1.09471 13.4718 1.09471C14.2011 1.09471 14.9178 1.15607 15.6168 1.27879C13.0112 1.52068 10.3255 2.66785 7.62566 4.69275C7.51094 4.77812 7.43713 4.90974 7.42379 5.05202C7.40956 5.19431 7.45758 5.33748 7.55362 5.4442C8.43491 6.4153 9.31531 7.47799 10.3264 8.78702C10.4945 9.00578 10.8022 9.05114 11.0281 8.89017C13.0646 7.43086 14.8307 6.35127 16.5417 5.52157C16.4661 6.39929 15.2922 7.75812 14.065 8.78524C12.1041 10.3904 9.74306 12.0596 7.09475 12.273L6.99159 12.2819C6.60209 12.2997 6.18323 12.2543 5.74748 12.1458C4.69989 11.8773 3.77592 10.9631 3.3962 9.82303V9.82392ZM11.9921 22.3762C9.58832 22.3762 7.37577 21.5563 5.61942 20.1805C5.95557 20.2108 6.30951 20.2259 6.69368 20.2259C7.01649 20.2259 7.36065 20.2152 7.73148 20.1939C9.9218 20.0338 12.1859 19.3819 14.2793 18.3086C16.3958 17.2237 18.2402 15.7554 19.6168 14.0596C20.5088 12.9302 21.5777 11.1952 21.881 9.09204C21.8996 9.11783 21.9183 9.14451 21.937 9.17119C22.1976 10.0791 22.3372 11.0378 22.3372 12.0293C22.3372 17.743 17.7049 22.3753 11.9912 22.3753L11.9921 22.3762Z" fill="#E2E2E2"/>
</svg>
`;

        const logosLayout = document.createElement('div')
        logosLayout.className = 'logos-wrap revert'

        logosLayout.appendChild(logo);

        logosLayout.appendChild(videoWrap)
        subtitleLayout.appendChild(logosLayout)

        const subtitleText = document.createElement('div')
        subtitleText.className = 'content-subtitles__text'

        subtitleLayout.appendChild(subtitleText)
        container.appendChild(subtitleLayout)

        const setSubtitlesVisible = (visible: boolean) => {
            subtitleLayout.style.display = visible ? '' : 'none'
        }

        const startSubtitleVideo = () => { voiceVideo.play().catch(() => {}) }
        const stopSubtitleVideo = () => { voiceVideo.pause(); voiceVideo.currentTime = 0 }

        setSubtitlesVisible(true)

        const activePanel = stack.children[state.currentContentIndex] as HTMLElement | undefined
        const initialModel = currentSection.type === 'models' ? currentSection.models[0] : null
        const initialSubtitleSource: ModelChangeDetail =
            currentSection.type === 'models'
                ? {
                    audio: (activePanel?.querySelector('.content-model audio') as HTMLAudioElement | null) ?? null,
                    subtitles: initialModel?.subtitles,
                    subtitlesUrl: initialModel?.subtitlesUrl,
                }
                : {
                    audio: (activePanel?.querySelector('audio') as HTMLAudioElement | null) ?? null,
                    subtitles: currentSection.subtitles,
                    subtitlesUrl: currentSection.subtitlesUrl,
                }

        const subtitleAnimationClasses = ['subtitle-animate-in', 'subtitle-animate-out'] as const
        const buildFallbackCues = (lines?: string[]) =>
            (lines || []).map((line, index) => createCueFromText(line, index * 3, index * 3 + 2.75))

        let subtitleAudio: HTMLAudioElement | null = null
        let subtitleFallbackCues: SubtitleCue[] = buildFallbackCues(initialSubtitleSource.subtitles)
        let currentSubtitlesUrl = initialSubtitleSource.subtitlesUrl
        let subtitleCues: SubtitleCue[] = []
        let activeCueIndex: number | null = null
        let isSubtitleVisible = false
        let isSubtitleAnimatingOut = false
        let cancelPendingHide: (() => void) | null = null

        const playSubtitleAnimation = (className: (typeof subtitleAnimationClasses)[number]) => {
            subtitleAnimationClasses.forEach((animationClass) => subtitleText.classList.remove(animationClass))
            void subtitleText.offsetWidth
            subtitleText.classList.add(className)
        }

        const animateSubtitleIn = () => {
            isSubtitleAnimatingOut = false
            isSubtitleVisible = true
            playSubtitleAnimation('subtitle-animate-in')
            startSubtitleVideo()
        }

        const animateSubtitleOut = (onFinish?: () => void) => {
            if (isSubtitleAnimatingOut || !isSubtitleVisible) { onFinish?.(); return }
            isSubtitleAnimatingOut = true
            playSubtitleAnimation('subtitle-animate-out')
            let cancelled = false
            cancelPendingHide = () => { cancelled = true; cancelPendingHide = null }
            const handleAnimationEnd = () => {
                subtitleText.removeEventListener('animationend', handleAnimationEnd)
                if (cancelled) return
                isSubtitleAnimatingOut = false
                cancelPendingHide = null
                onFinish?.()
            }
            subtitleText.addEventListener('animationend', handleAnimationEnd)
        }

        const renderCueLines = (cue: SubtitleCue | null) => {
            subtitleText.replaceChildren()
            if (!cue) return
            cue.text.split(/\r?\n/).forEach((line) => {
                const paragraph = document.createElement('p')
                paragraph.textContent = line
                subtitleText.appendChild(paragraph)
            })
        }

        const clearSubtitleContent = () => {
            subtitleText.replaceChildren()
            isSubtitleVisible = false
            isSubtitleAnimatingOut = false
            stopSubtitleVideo()
        }

        const hideSubtitle = () => {
            if (!subtitleText.childElementCount) { clearSubtitleContent(); return }
            animateSubtitleOut(clearSubtitleContent)
        }

        const subtitleTimeTolerance = 0.15
        const findActiveCueIndex = (current: number) =>
            subtitleCues.findIndex((cue) => {
                const cueStart = Math.max(0, cue.start - subtitleTimeTolerance)
                const cueEnd = cue.end + subtitleTimeTolerance
                return current >= cueStart && current < cueEnd
            })

        const showFinalCue = () => {
            if (!subtitleCues.length) return
            const lastCueIndex = subtitleCues.length - 1
            const lastCue = subtitleCues[lastCueIndex]
            const isAlreadyShowingLastCue =
                activeCueIndex === lastCueIndex && subtitleText.childElementCount > 0 && isSubtitleVisible
            if (isAlreadyShowingLastCue) return
            activeCueIndex = lastCueIndex
            cancelPendingHide?.(); cancelPendingHide = null
            renderCueLines(lastCue)
            animateSubtitleIn()
        }

        const updateSubtitles = () => {
            if (!subtitleAudio) return
            if (!subtitleCues.length) { hideSubtitle(); return }
            const current = subtitleAudio.currentTime
            const activeIndexNext = findActiveCueIndex(current)
            if (activeIndexNext !== -1) {
                const activeCue = subtitleCues[activeIndexNext]
                const cueChanged = activeCueIndex !== activeIndexNext
                if (cueChanged) {
                    activeCueIndex = activeIndexNext
                    cancelPendingHide?.(); cancelPendingHide = null
                    renderCueLines(activeCue)
                    animateSubtitleIn()
                }
            } else if (subtitleAudio.ended) {
                showFinalCue()
            } else {
                if (isSubtitleVisible) return
                hideSubtitle()
            }
        }

        const setSubtitles = (cues: SubtitleCue[]) => {
            subtitleCues = cues.length ? cues : subtitleFallbackCues
            activeCueIndex = null
            if (!subtitleCues.length) { clearSubtitleContent(); return }
            cancelPendingHide?.(); cancelPendingHide = null
            renderCueLines(subtitleCues[0])
            animateSubtitleIn()
            updateSubtitles()
        }

        const detachSubtitleListeners = () => {
            subtitleAudio?.removeEventListener('timeupdate', updateSubtitles)
            subtitleAudio?.removeEventListener('seeked', updateSubtitles)
            subtitleAudio?.removeEventListener('play', updateSubtitles)
            subtitleAudio?.removeEventListener('ended', showFinalCue)
        }

        const attachSubtitleListeners = () => {
            subtitleAudio?.addEventListener('timeupdate', updateSubtitles)
            subtitleAudio?.addEventListener('seeked', updateSubtitles)
            subtitleAudio?.addEventListener('play', updateSubtitles)
            subtitleAudio?.addEventListener('ended', showFinalCue)
        }

        const syncSubtitleAudio = (nextAudio: HTMLAudioElement | null) => {
            if (subtitleAudio === nextAudio) return
            detachSubtitleListeners()
            subtitleAudio = nextAudio
            attachSubtitleListeners()
            updateSubtitles()
        }

        const setSubtitleSource = (source: ModelChangeDetail) => {
            subtitleFallbackCues = buildFallbackCues(source.subtitles)
            currentSubtitlesUrl = source.subtitlesUrl
            subtitleCues = []
            activeCueIndex = null
            syncSubtitleAudio(source.audio ?? null)
            if (currentSubtitlesUrl) {
                loadSrtSubtitles(currentSubtitlesUrl, subtitleFallbackCues).then(setSubtitles)
            } else {
                setSubtitles(subtitleFallbackCues)
            }
        }

        setSubtitleSource(initialSubtitleSource)

        const disableSubtitles = () => {
            setSubtitlesVisible(false)
            syncSubtitleAudio(null)
            subtitleText.replaceChildren()
            stopSubtitleVideo()
            setSubtitlesVisible(false)
        }

        setSubtitleSourceFn = (source: ModelChangeDetail) => {
            setSubtitlesVisible(true)
            setSubtitleSource(source)
        }

        disableSubtitlesFn = disableSubtitles

        if (currentSection.type === 'models') {
            const modelPanel = stack.children[state.currentContentIndex] as HTMLElement | undefined
            const handleModelChange = (event: Event) => {
                const detail = (event as CustomEvent<ModelChangeDetail>).detail
                if (!detail) return
                setSubtitleSource(detail)
            }
            modelPanel?.addEventListener('modelchange', handleModelChange)
            modelPanel?.dispatchEvent(new Event('request-modelstate'))
            cleanupCallbacks.push(() => { modelPanel?.removeEventListener('modelchange', handleModelChange) })
        }

        cleanupCallbacks.push(() => { detachSubtitleListeners() })
    }

    renderHint()
    container.appendChild(hint)

    // Разлочка на первый жест
    const getActiveAudioElSafe = () => {
        const a = getActiveAudioEl()
        return a?.currentSrc || a?.src || undefined
    }

    const gestureHintCleanup = maybeShowGestureHint(container, () => {
        unlockAudioPlaybackOnce(getActiveAudioElSafe())
        syncMediaState()
    })
    if (gestureHintCleanup) cleanupCallbacks.push(gestureHintCleanup)

    let audioUnlockTried = false
    const tryUnlockOnTouchStart = () => {
        if (audioUnlockTried) return
        audioUnlockTried = true
        unlockAudioPlaybackOnce(getActiveAudioElSafe())
        syncMediaState()
    }

    /* свайпы */
    let startX = 0
    let startY = 0
    let isTouching = false
    let gestureFromModel = false
    const isFromModelViewer = (event: TouchEvent) => {
        const target = event.target as HTMLElement | null
        return !!target?.closest('.content-model__viewer')
    }

    const onTouchStart = (event: TouchEvent) => {
        tryUnlockOnTouchStart()
        gestureFromModel = isFromModelViewer(event)
        gestureFromCards = isFromCards(event)
        if (gestureFromModel) return
        warmupAround(state.currentContentIndex)
        startX = event.touches[0].clientX
        startY = event.touches[0].clientY
        isTouching = true
    }
    const onTouchMove = (event: TouchEvent) => {
        if (gestureFromModel || !isTouching) return
        const touch = event.touches[0]
        const deltaY = touch.clientY - startY
        const deltaX = touch.clientX - startX
        if (Math.abs(deltaY) > Math.abs(deltaX) && event.cancelable) event.preventDefault()
    }
    const onTouchEnd = (event: TouchEvent) => {
        if (gestureFromModel) { gestureFromModel = false; return }
        if (!isTouching) return
        const deltaY = event.changedTouches[0].clientY - startY
        const deltaX = event.changedTouches[0].clientX - startX
        isTouching = false

        // актуальная секция на момент завершения жеста
        const sectionNow = config.sections[state.currentContentIndex]
        const isCardsNow = sectionNow?.type === 'cards'

        // вниз (к предыдущему сюжету) — усиливаем только на карточках
        const downThreshold =
            (gestureFromCards || isCardsNow) ? SWIPE_THRESHOLD * CARDS_DOWN_SWIPE_FACTOR : SWIPE_THRESHOLD

        // небольшая защита от диагонали: вниз сработает только если вертикаль явно доминирует
        const isClearlyVertical = Math.abs(deltaY) > Math.abs(deltaX) * 1.15

        if (deltaY < -SWIPE_THRESHOLD && state.currentContentIndex < config.sections.length - 1) {
            // вверх — как раньше
            goToContentIndex(state.currentContentIndex + 1)
        } else if (
            deltaY > downThreshold &&                    // нужен «тяжёлый» жест вниз
            isClearlyVertical &&                         // и явно вертикальный
            state.currentContentIndex > 0
        ) {
            goToContentIndex(state.currentContentIndex - 1)
        }

        // сбрасываем флаг карточек после жеста
        gestureFromCards = false
    }

    container.addEventListener('touchstart', onTouchStart)
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd)
    cleanupCallbacks.push(() => {
        container.removeEventListener('touchstart', onTouchStart)
        container.removeEventListener('touchmove', onTouchMove)
        container.removeEventListener('touchend', onTouchEnd)
    })

    cleanupCallbacks.push(clearAutoplay)

    const onVisibility = () => {
        if (document.hidden) {
            mediaElements.forEach((m) => { try { m.pause() } catch {} })
        } else {
            syncMediaState()
        }
    }
    document.addEventListener('visibilitychange', onVisibility)
    cleanupCallbacks.push(() => document.removeEventListener('visibilitychange', onVisibility))

    const cleanup = () => { cleanupCallbacks.forEach((fn) => fn()) }
    return { element: container, cleanup }
}

const renderCardsSection = (section: CardsContent) => {
    const container = document.createElement('div')
    container.className = 'content-panel content-panel--cards'
    const viewport = document.createElement('div')
    viewport.className = 'content-cards content-cards--stacked'
      viewport.style.touchAction = 'none'
      ;(container.style as any).overscrollBehaviorX = 'contain'
    const track = document.createElement('div')
    track.className = 'content-cards__track'

    section.cards.forEach((card) => {
        const cardEl = document.createElement('article')
        cardEl.className = 'content-card'
        cardEl.innerHTML = `
      <div class="content-card__image-wrapper">
        <img class="content-card__image ${card.text.length > 150 ? 'is-long' : ''}" src="${card.image}" alt="${card.alt || card.title}">
      </div>
       <div class="content-card__body">
        <h3 class="content-card__title">${card.title}</h3>
        <p class="content-card__text">${card.text}</p>
      </div>
    `
        track.appendChild(cardEl)
    })

    let activeIndex = 0
          let startX = 0
          let startY = 0
          let isTouching = false
          let intent: 'none' | 'h' | 'v' = 'none'
          let edgeGuard = false

    const controls = document.createElement('div')
    controls.className = 'content-cards__controls'

    const prev = document.createElement('button')
    prev.className = 'content-cards__nav content-cards__nav--prev'
    prev.setAttribute('aria-label', 'Предыдущая карточка')
    prev.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.825 13L13.425 18.6L12 20L4 12L12 4L13.425 5.4L7.825 11L20 11V13L7.825 13Z" fill="#E2E2E2"/>
    </svg>
  `

    const next = document.createElement('button')
    next.className = 'content-cards__nav content-cards__nav--next'
    next.setAttribute('aria-label', 'Следующая карточка')
    next.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.825 13L13.425 18.6L12 20L4 12L12 4L13.425 5.4L7.825 11L20 11V13L7.825 13Z" fill="#E2E2E2"/>
    </svg>
  `

    const dots = document.createElement('div')
    dots.className = 'content-cards__dots'

    const stackStyles = [
        { translateY: 0, scale: 1, opacity: 1, rotate: 0, shadow: '0px 18px 48px rgba(0, 0, 0, 0.35)', blur: 0, },
        { translateY: 0, translateX: -25, scale: 0.97, opacity: 0.92, rotate: -7, shadow: '0px 12px 32px rgba(0, 0, 0, 0.26)', blur: 1.5, },
        { translateY: 0, translateX: 25, scale: 0.94, opacity: 0.84, rotate: 7, shadow: '0px 10px 24px rgba(0, 0, 0, 0.22)', blur: 3, },
        { translateY: 46, scale: 0.9, opacity: 0.78, rotate: -0.85, shadow: '0px 6px 16px rgba(0, 0, 0, 0.18)', blur: 4, },
    ]

    const applyStack = () => {
        const total = section.cards.length
        const cards = Array.from(track.children) as HTMLElement[]
        cards.forEach((card, index) => {
            const relativePosition = (index - activeIndex + total) % total
            const style = stackStyles[relativePosition]
            card.classList.toggle('is-active', relativePosition === 0)
            card.classList.toggle('is-hidden', relativePosition >= stackStyles.length)
            if (style) {
                card.style.setProperty('--stack-translate', `${style.translateY}px`)
                card.style.setProperty('--drag-translate', `${(style as any).translateX ?? 0}px`)
                card.style.setProperty('--stack-scale', `${style.scale}`)
                card.style.setProperty('--stack-rotate', `${style.rotate}deg`)
                card.style.setProperty('--stack-shadow', style.shadow)
                card.style.setProperty('--stack-blur', `${style.blur || 0}px`)
                card.style.opacity = `${style.opacity}`
                card.style.zIndex = String(stackStyles.length - relativePosition)
            } else {
                card.style.setProperty('--stack-translate', '32px')
                card.style.setProperty('--stack-scale', '0.9')
                card.style.setProperty('--stack-rotate', '0deg')
                card.style.setProperty('--stack-shadow', 'none')
                card.style.setProperty('--stack-blur', '0px')
                card.style.opacity = '0'
                card.style.zIndex = '0'
            }
        })
        Array.from(dots.children).forEach((dot, index) => {
            dot.classList.toggle('is-active', index === activeIndex)
        })
    }

    const goToIndex = (index: number) => {
        activeIndex = (index + section.cards.length) % section.cards.length
        applyStack()
    }
    const goPrev = () => goToIndex(activeIndex - 1)
    const goNext = () => goToIndex(activeIndex + 1)

    section.cards.forEach((_, index) => {
        const dot = document.createElement('span')
        dot.className = 'content-cards__dot'
        dots.appendChild(dot)
        dot.addEventListener('click', () => { goToIndex(index) })
    })

    prev.addEventListener('click', goPrev)
    next.addEventListener('click', goNext)

    const getActiveCard = () => track.children[activeIndex] as HTMLElement | undefined

    const animateSwipeAway = (direction: 'next' | 'prev') => {
        const activeCard = getActiveCard()
        const translateSign = direction === 'next' ? -1 : 1
        if (!activeCard) { direction === 'next' ? goNext() : goPrev(); return }
        activeCard.style.transition = 'transform 0.25s ease, opacity 0.25s ease, filter 0.25s ease'
        activeCard.style.setProperty('--drag-translate', `${translateSign * 420}px`)
        activeCard.style.setProperty('--drag-rotate', `${translateSign * 16}deg`)
        activeCard.style.opacity = '0'
        activeCard.style.filter = 'blur(3px)'
        window.setTimeout(() => {
            direction === 'next' ? goNext() : goPrev()
            activeCard.style.transition = ''
            activeCard.style.setProperty('--drag-translate', '0px')
            activeCard.style.setProperty('--drag-rotate', '0deg')
            activeCard.style.opacity = ''
            activeCard.style.filter = ''
        }, 220)
    }

    const onTouchStart = (event: TouchEvent) => {
            const t = event.touches[0]
            startX = t.clientX
            startY = t.clientY
            isTouching = true
            intent = 'none'
                const vw = window.innerWidth
           edgeGuard = (startX < EDGE_GUARD_PX) || (startX > vw - EDGE_GUARD_PX)
               const activeCard = getActiveCard()
                if (activeCard) { activeCard.style.transition = 'none' }
          }

    const onTouchMove = (event: TouchEvent) => {
            if (!isTouching || edgeGuard) return
            const t = event.touches[0]
                const dx = t.clientX - startX
                const dy = t.clientY - startY

                if (intent === 'none') {
                 if (Math.abs(dx) > INTENT_THRESHOLD || Math.abs(dy) > INTENT_THRESHOLD) {
                        intent = (Math.abs(dx) > Math.abs(dy) * H_DOMINANCE) ? 'h' : 'v'
                          } else {
                        return
                      }
                }
            if (intent !== 'h') return
            if (event.cancelable) event.preventDefault() // why: не даём странице паниться вбок
            event.stopPropagation()
            const activeCard = getActiveCard()
                if (!activeCard) return
            activeCard.style.setProperty('--drag-translate', `${dx}px`)
           const rotateDelta = Math.max(-12, Math.min(12, dx / 14))
                activeCard.style.setProperty('--drag-rotate', `${rotateDelta}deg`)
              }


    const onTouchEnd = (event: TouchEvent) => {
            if (!isTouching) return
            isTouching = false
                if (edgeGuard) { edgeGuard = false; intent = 'none'; return }
            if (intent !== 'h') { intent = 'none'; return }
            intent = 'none'
                const deltaX = event.changedTouches[0].clientX - startX
               if (Math.abs(deltaX) < SWIPE_THRESHOLD) {
            const activeCard = getActiveCard()
            if (activeCard) {
                activeCard.style.transition = ''
                activeCard.style.setProperty('--drag-translate', '0px')
                activeCard.style.setProperty('--drag-rotate', '0deg')
            }
            applyStack()
            return
        }
        if (deltaX < -SWIPE_THRESHOLD) { animateSwipeAway('next') }
        else if (deltaX > SWIPE_THRESHOLD) { animateSwipeAway('prev') }
    }

    viewport.addEventListener('touchstart', onTouchStart,  { passive: false })
    viewport.addEventListener('touchmove', onTouchMove, { passive: false })
    viewport.addEventListener('touchend', onTouchEnd, { passive: false })

    applyStack()

    controls.appendChild(prev)
    controls.appendChild(next)

    viewport.appendChild(track)
    viewport.appendChild(controls)

    container.appendChild(viewport)
    container.appendChild(dots)

    return container
}

type ModelChangeDetail = {
    audio: HTMLAudioElement | null
    subtitles?: string[]
    subtitlesUrl?: string
}

const renderModelsSection = (section: ModelsContent) => {
    const container = document.createElement('div')
    container.className = 'content-panel content-panel--models'

    if (section.hint) {
        const hint = document.createElement('div')
        hint.className = 'content-models__hint'
        hint.innerHTML = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.466 7.5C15.643 4.237 13.952 2 12 2C9.239 2 7 6.477 7 12C7 17.523 9.239 22 12 22C12.3427 21.9987 12.676 21.932 13 21.8M15.194 13.707L19.008 15.567L17.148 19.381" stroke="#E2E2E2" stroke-width="1.5" stroke-linejoin="round"/><path d="M19 15.57C17.196 16.455 14.726 17 12 17C6.477 17 2 14.761 2 12C2 9.239 6.477 7 12 7C16.838 7 20.873 8.718 21.8 11" stroke="#E2E2E2" stroke-width="1.5" stroke-linejoin="round"/></svg>
<span>${section.hint}</span>`
        container.appendChild(hint)
    }

    const viewport = document.createElement('div')
    viewport.className = 'content-models'
    const track = document.createElement('div')
    track.className = 'content-models__track'
    const controls = document.createElement('div')
    controls.className = 'content-models__controls'

    const prev = document.createElement('button')
    prev.className = 'content-cards__nav content-cards__nav--prev'
    prev.setAttribute('aria-label', 'Предыдущая модель')
    prev.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.825 13L13.425 18.6L12 20L4 12L12 4L13.425 5.4L7.825 11L20 11V13L7.825 13Z" fill="#E2E2E2"/>
    </svg>
  `
    const next = document.createElement('button')
    next.className = 'content-cards__nav content-cards__nav--next'
    next.setAttribute('aria-label', 'Следующая модель')
    next.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.825 13L13.425 18.6L12 20L4 12L12 4L13.425 5.4L7.825 11L20 11V13L7.825 13Z" fill="#E2E2E2"/>
    </svg>
  `

    const dots = document.createElement('div')
    dots.className = 'content-cards__dots content-models__dots'

    let activeIndex = 0
    const modelCards: { card: HTMLElement; audio: HTMLAudioElement | null }[] = []

    const dispatchActiveModelChange = () => {
        const activeModel = section.models[activeIndex]
        const activeAudio = modelCards[activeIndex]?.audio ?? null
        container.dispatchEvent(new CustomEvent<ModelChangeDetail>('modelchange', {
            detail: { audio: activeAudio, subtitles: activeModel?.subtitles, subtitlesUrl: activeModel?.subtitlesUrl },
        }))
    }

    container.addEventListener('request-modelstate', () => { dispatchActiveModelChange() })

    const updateActive = () => {
        if (isGestureOverlayVisible) { dispatchActiveModelChange(); return }
        const cards = Array.from(track.children) as HTMLElement[]
        cards.forEach((card, index) => {
            const isActive = index === activeIndex
            card.classList.toggle('is-active', isActive)
            card.classList.toggle('is-hidden', !isActive)
        })
        Array.from(dots.children).forEach((dot, index) => { dot.classList.toggle('is-active', index === activeIndex) })

        modelCards.forEach(({ card, audio }) => {
            if (!audio) return
            const isCardActive = card.classList.contains('is-active')
            if (!isCardActive) { audio.pause(); audio.currentTime = 0 }
        })

        const activeModelAudio = modelCards.find(({ card }) => card.classList.contains('is-active'))?.audio
        const isPanelActive = container.closest('.content-stack__item')?.classList.contains('is-active')

        if (activeModelAudio && isPanelActive) {
            playAudioWithIOSAutoplayHack(activeModelAudio, !state.soundEnabled ? false : true)
        }

        dispatchActiveModelChange()
    }

    const goToIndex = (index: number) => { activeIndex = (index + section.models.length) % section.models.length; updateActive() }
    const goPrev = () => goToIndex(activeIndex - 1)
    const goNext = () => goToIndex(activeIndex + 1)

    section.models.forEach((model) => {
        const card = document.createElement('article')
        card.className = 'content-model'

        const viewer = document.createElement('model-viewer') as HTMLElement
        viewer.className = 'content-model__viewer'
        viewer.poster = model.poster || ''
        viewer.setAttribute('src', model.src)
        viewer.setAttribute('camera-controls', '')
        viewer.setAttribute('interaction-prompt', 'none')
        viewer.setAttribute('disable-zoom', '')
        viewer.setAttribute('disable-tap', '')
        viewer.setAttribute('shadow-intensity', '0.65')
        viewer.setAttribute('alt', model.alt || model.title)
        viewer.style.touchAction = 'none'

        let activeTouches = 0
        const lockIfFirstTouch = () => { if (activeTouches === 0) { lockModelGestureScroll() } }

        const onTouchStart = (event: TouchEvent) => {
            lockIfFirstTouch()
            activeTouches = event.touches.length
            if (event.cancelable) { event.preventDefault() }
            event.stopPropagation()
        }
        const onTouchMove = (event: TouchEvent) => {
            if (event.cancelable) { event.preventDefault() }
            event.stopPropagation()
        }
        const onTouchEnd = (event: TouchEvent) => {
            activeTouches = event.touches.length
            if (activeTouches === 0) { releaseModelGestureScroll() }
            event.stopPropagation()
        }

        viewer.addEventListener('touchstart', onTouchStart, { passive: false })
        viewer.addEventListener('touchmove', onTouchMove, { passive: false })
        viewer.addEventListener('touchend', onTouchEnd)
        viewer.addEventListener('touchcancel', onTouchEnd)

        const info = document.createElement('div')
        info.className = 'content-model__info'
        info.innerHTML = `<h3 class="content-model__title">${model.title}</h3>`

        if (model.audio) {
            const audio = document.createElement('audio')
            audio.className = 'guide__audio guide__audio--inline content-model__audio'
            audio.controls = false
            audio.preload = 'auto'
            audio.setAttribute('playsinline', '')
            audio.src = model.audio
            audio.hidden = true
            audio.setAttribute('aria-hidden', 'true')
            if (model.subtitlesUrl) {
                const track = document.createElement('track')
                track.kind = 'subtitles'
                track.src = model.subtitlesUrl
                track.default = true
                audio.appendChild(track)
            }
            info.appendChild(audio)
            modelCards.push({ card, audio })
        } else {
            modelCards.push({ card, audio: null })
        }

        card.appendChild(viewer)
        card.appendChild(info)
        track.appendChild(card)
    })

    section.models.forEach((_, index) => {
        const dot = document.createElement('span')
        dot.className = 'content-cards__dot'
        dots.appendChild(dot)
        dot.addEventListener('click', () => goToIndex(index))
    })

    prev.addEventListener('click', goPrev)
    next.addEventListener('click', goNext)

    controls.appendChild(prev)
    controls.appendChild(next)

    viewport.appendChild(track)
    viewport.appendChild(controls)

    container.appendChild(viewport)

    if (section.description) {
        const description = document.createElement('p')
        description.className = 'content-models__description'
        description.textContent = section.description
        container.appendChild(description)
    }

    container.appendChild(dots)

    updateActive()

    return container
}

const renderAudioSection = (section: AudioContent) => {
    const container = document.createElement('div')
    container.className = 'content-panel content-panel--guide card--guide'

    if (section.backgroundOverlay) {
        const backgroundOverlay = document.createElement('div')
        backgroundOverlay.className = 'guide__background-logo'
        backgroundOverlay.style.backgroundImage = `url(${section.backgroundOverlay})`
        container.appendChild(backgroundOverlay)
    }

    const content = document.createElement('div')
    content.className = 'guide__content'

    if (section.logo) {
        const logo = document.createElement('img')
        logo.className = 'guide__logo'
        logo.src = section.logo
        logo.alt = 'Логотип галереи'
        content.appendChild(logo)
    }

    const hero = document.createElement('div')
    hero.className = 'guide__hero'

    const hero2 = document.createElement('div')
    hero2.className = 'guide__wrap-video'

    const voiceVideo = document.createElement('video')
    voiceVideo.className = 'guide__hero-image'
    voiceVideo.muted = true
    voiceVideo.defaultMuted = true
    voiceVideo.loop = true
    voiceVideo.playsInline = true
    voiceVideo.autoplay = false
    voiceVideo.preload = 'metadata'
    voiceVideo.setAttribute('playsinline', '')
    voiceVideo.setAttribute('muted', '')
    voiceVideo.setAttribute('aria-hidden', 'true')

    const srcWebm = document.createElement('source')
    srcWebm.src = onboardingVoiceVideoWebm
    srcWebm.type = 'video/webm; codecs="vp9"'

    const srcMov = document.createElement('source')
    srcMov.src = onboardingVoiceVideoMov
    srcMov.type = 'video/quicktime'

    voiceVideo.appendChild(srcMov)
    voiceVideo.appendChild(srcWebm)

    hero2.appendChild(voiceVideo)
    hero.appendChild(hero2)
    content.appendChild(hero)

    const startVoiceVideo = () => { voiceVideo?.play().catch(() => {}) }
    const stopVoiceVideo = () => {
        if (!voiceVideo) return
        voiceVideo.pause()
        try { voiceVideo.currentTime = 0 } catch {}
    }

    const audio = document.createElement('audio')
    audio.className = 'guide__audio'
    audio.controls = false
    audio.preload = 'auto'
    audio.setAttribute('playsinline', '')
    audio.src = section.src

    content.appendChild(hero)
    content.appendChild(audio)

    container.appendChild(content)

    return container
}
