import { guideVoiceAssets, photoZonePoint, points } from '../data'
import { rerender } from '../navigation'
import {
  saveCameraPermissionGranted,
  saveNextPointHintsCompleted,
  saveSoundEnabled,
  saveViewed,
} from '../storage'
import { isRouteCompleted, resetProgress, state, viewedPoints } from '../state'
import { createButton } from '../ui'
import onboardingVoiceVideoWebm from '../assets/speaking-voice.webm'
import onboardingVoiceVideoMov from '../assets/speaking-voice.mov'
import { loadSrtSubtitles, SubtitleCue } from '../subtitles'
import { hasCameraPermission } from '../permissions'
import { RenderResult } from '../types'
import { openMapOverlay } from './map'

type HintStep = {
  target: HTMLElement
  anchor: HTMLElement
  message: string
  arrowSvg: string
}

const pointProgressHeadings = [
  {
    title: 'Пройдено 0 из 6 точек',
    subtitle: 'Перейдём к первой точке',
  },
  {
    title: 'Пройдено 1 из 6 точек',
    subtitle: 'Готовы к следующей?',
  },
  {
    title: 'Пройдено 2 из 6 точек',
    subtitle: 'Следующая точка уже близко',
  },
  {
    title: 'Пройдено 3 из 6 точек',
    subtitle: 'Продолжаем путешествие!',
  },
  {
    title: 'Пройдено 4 из 6 точек',
    subtitle: 'Осталось всего пару шагов',
  },
  {
    title: 'Пройдено 5 из 6 точек',
    subtitle: 'Осталась последняя точка!',
  },
]

const getPointProgressHeading = (completedPoints: number) => {
  if (completedPoints >= points.length) {
    return {
      title: `Пройдено ${points.length} из ${points.length} точек`,
      subtitle: 'Маршрут завершён',
    }
  }

  const headingIndex = Math.min(completedPoints, pointProgressHeadings.length - 1)
  return pointProgressHeadings[headingIndex] || pointProgressHeadings[0]
}

const mapArrowSvg = `
  <svg width="26" height="61" viewBox="0 0 26 61" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.07031 0C7.78825 0.957574 13.9441 4.28102 18.4307 9.37207C22.9172 14.4632 25.4398 20.9883 25.5449 27.7734C25.65 34.5584 23.3313 41.1581 19.0049 46.3857C14.8078 51.4569 8.98814 54.9134 2.54102 56.1797L7.66992 59.1406L7.16992 60.0068L0.613281 56.2217L4.39844 49.665L5.26465 50.165L2.3584 55.1963C8.57536 53.973 14.1867 50.6396 18.2344 45.749C22.4092 40.7048 24.6473 34.336 24.5459 27.7891C24.4445 21.242 22.0098 14.9457 17.6807 10.0332C13.3516 5.12079 7.41186 1.91426 0.929688 0.990234L1.07031 0Z" fill="#E2E2E2"/>
  </svg>
`

const routeArrowSvg = `
  <svg width="65" height="37" viewBox="0 0 65 37" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24.6048 18.6149C29.1552 20.3846 34.2187 21.3996 38.8533 21.3361C43.4779 21.2725 47.7437 20.1328 50.6198 17.5181C54.322 14.1522 55.1877 9.80169 55.0465 3.43954L58.9833 7.86098L59.7303 7.19595L54.696 1.54152L49.0415 6.57584L49.7066 7.32287L54.0469 3.45676C54.1866 9.74074 53.3196 13.7127 49.9474 16.7786C47.3237 19.1638 43.3385 20.2741 38.8389 20.3358C34.3494 20.3974 29.4135 19.4129 24.9667 17.6834L24.7857 18.1487L24.6048 18.6149Z" fill="#E2E2E2"/>
  </svg>
`

const createButtonHint = (step: HintStep) => {
  const hint = document.createElement('div')
  hint.className = 'next-point-hint'
  hint.innerHTML = `
    <p class="next-point-hint__text">${step.message}</p>
    <div class="next-point-hint__arrow ${step.message.includes('гид')? 'home' : ''}" aria-hidden="true">${step.arrowSvg}</div>
  `
  document.body.appendChild(hint)

  return () => {
    hint.remove()
  }
}


const markPointAsViewed = () => {
  viewedPoints.add(points[state.currentPointIndex].id)
  saveViewed(viewedPoints)
}

export const handleFinishPoint = () => {
  markPointAsViewed()

  if (state.routeMode === 'solo') {
    state.screen = 'routeList'
    return
  }

  if (isRouteCompleted()) {
    state.screen = 'routeComplete'
    return
  }

  state.screen = 'infoComplete'
}

export const navigateToNextPoint = () => {
  markPointAsViewed()

    console.log(state.routeMode)
  if (state.routeMode === 'solo') {
    state.screen = 'routeList'
    return
  }

  if (isRouteCompleted()) {
    state.screen = 'routeComplete'
    return
  }

  const nextIndex = Math.min(state.currentPointIndex + 1, points.length - 1)
  state.currentPointIndex = nextIndex
  state.screen = 'nextPoint'
}

export const renderPointInfo = (): HTMLElement => {
  const point = points[state.currentPointIndex]
  const highlightsList = point.highlights?.length
    ? `<p class="text-block__title">Обратите внимание</p>
        <ul class="text-block__list">
          ${point.highlights.map((item) => `<li>${item}</li>`).join('')}
        </ul>`
    : ''

  const textBlock = point.longDescription || highlightsList
    ? `<div class="text-block">
        ${point.longDescription ? `<p class="text-block__lead">${point.longDescription}</p>` : ''}
        ${highlightsList}
      </div>`
    : ''

  const section = document.createElement('section')
  section.className = 'card'
  section.innerHTML = `
    <div class="card__meta card__meta--inline">Маршрут «Голос времени»</div>
    <h1>${point.title}</h1>
    <p>${point.description}</p>
    ${textBlock}
    <div class="card__preview large">
    </div>
    <div class="point-layout__actions">
      <button class="button secondary" data-action="intro">Вводный контент точки</button>
    </div>
    <button class="button primary" data-action="finish">Закончить точку</button>
  `

  section.querySelector<HTMLButtonElement>('[data-action="intro"]')?.addEventListener('click', () => {
    state.screen = 'pointContent'
    state.currentContentIndex = 0
    rerender()
  })

  section.querySelector<HTMLButtonElement>('[data-action="finish"]')?.addEventListener('click', () => {
    handleFinishPoint()
    rerender()
  })

  return section
}

export const renderInfoComplete = (): HTMLElement => {
  const completedPoints = viewedPoints.size
  const heading = getPointProgressHeading(completedPoints)
  const remaining = Math.max(points.length - completedPoints, 0)
  const routeCompleted = isRouteCompleted()

  document.title = heading.title

  const overlay = document.createElement('div')
  overlay.className = 'overlay'
  overlay.innerHTML = `
    <div class="modal">
      <p class="modal__eyebrow">${heading.title}</p>
      <h2 class="modal__title">${heading.subtitle}</h2>
      <p>
        ${
          remaining > 0
            ? `Впереди ещё ${remaining} истории`
            : 'Вы посмотрели все точки маршрута. Можно выбрать эпоху и изучить контент.'
        }
      </p>
    </div>
  `

  const modal = overlay.querySelector<HTMLDivElement>('.modal')

  const primary = createButton(routeCompleted ? 'Перейти к выбору эпохи' : 'Да, узнать, где следующая точка')
  primary.addEventListener('click', () => {
    if (routeCompleted) {
      state.screen = 'routeList'
    } else {
      const nextIndex = Math.min(state.currentPointIndex + 1, points.length - 1)
      state.currentPointIndex = nextIndex
      state.screen = 'nextPoint'
    }
    rerender()
  })

  const secondary = createButton(
    routeCompleted ? 'Пройти маршрут с Гидом заново' : 'Нет, открыть весь маршрут',
    'secondary',
  )
  secondary.addEventListener('click', () => {
    if (routeCompleted) {
      resetProgress()
      state.routeMode = 'guide'
      state.screen = 'nextPoint'
    } else {
      state.screen = 'routeList'
    }
    rerender()
  })

  modal?.appendChild(primary)
  modal?.appendChild(secondary)
  return overlay
}

export const renderNextPoint = (): RenderResult => {
  const point = points[state.currentPointIndex]
  const completedPoints = viewedPoints.size
  const progressHeading = pointProgressHeadings[state.currentPointIndex]
  const headingText = progressHeading.title
  const subtitleText = progressHeading.subtitle
  const caption = point.guide?.caption || point.description
  const card = document.createElement('section')
  card.className = 'card card--point card--next'
  const cleanups: (() => void)[] = []
  card.innerHTML = `
    <div class="point-layout__header">
      <div>
        <p class="point-layout__eyebrow">${headingText}</p>
        <h1 class="point-layout__title">${subtitleText}</h1>
      </div>
      <button class="button icon-with-button primary route-button" data-action="route">
      Посмотреть <br>
      контент&nbsp;сразу
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 9.49902L19 20L14 20L14 14H10L10 20H5L5 9.49902L12 4.24902L19 9.49902Z" stroke="#E2E2E2" stroke-width="2"/>
        </svg>
      </button>
    </div>
    <div class="point-body">
        <article class="point-visual">
      <div class="point-visual__frame">
        <button class="button icon-with-button primary map-button" data-action="map">
        Открыть<br>
        карту
          <span class="icon-button__icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.35 20.7C4.01667 20.8333 3.70833 20.7958 3.425 20.5875C3.14167 20.3792 3 20.1 3 19.75L3 5.75C3 5.53333 3.0625 5.34167 3.1875 5.175C3.3125 5.00833 3.48333 4.88333 3.7 4.8L9 3L15 5.1L19.65 3.3C19.9833 3.16667 20.2917 3.20417 20.575 3.4125C20.8583 3.62083 21 3.9 21 4.25V12.675C20.75 12.2917 20.4542 11.9417 20.1125 11.625C19.7708 11.3083 19.4 11.0333 19 10.8V5.7L16 6.85L16 10C15.65 10 15.3083 10.0292 14.975 10.0875C14.6417 10.1458 14.3167 10.2333 14 10.35L14 6.85L10 5.45L10 18.525L4.35 20.7ZM5 18.3L8 17.15L8 5.45L5 6.45L5 18.3ZM16 18C16.5667 18 17.0375 17.8333 17.4125 17.5C17.7875 17.1667 17.9833 16.6667 18 16C18.0167 15.4333 17.8292 14.9583 17.4375 14.575C17.0458 14.1917 16.5667 14 16 14C15.4333 14 14.9583 14.1917 14.575 14.575C14.1917 14.9583 14 15.4333 14 16C14 16.5667 14.1917 17.0417 14.575 17.425C14.9583 17.8083 15.4333 18 16 18ZM16 20C14.9 20 13.9583 19.6083 13.175 18.825C12.3917 18.0417 12 17.1 12 16C12 14.9 12.3917 13.9583 13.175 13.175C13.9583 12.3917 14.9 12 16 12C17.1 12 18.0417 12.3917 18.825 13.175C19.6083 13.9583 20 14.9 20 16C20 16.3833 19.9542 16.7458 19.8625 17.0875C19.7708 17.4292 19.6333 17.75 19.45 18.05L22 20.6L20.6 22L18.05 19.45C17.75 19.6333 17.4292 19.7708 17.0875 19.8625C16.7458 19.9542 16.3833 20 16 20Z" fill="#E2E2E2"/>
            </svg>
          </span>
        </button>

        <div class="point-visual__placeholder" role="img" aria-label="${point.photoAlt || `Превью точки «${point.title}»`}">
        <img src="${point.photoWhere}" alt="">
</div>
        <p class="point-visual__caption">${caption}</p>
      </div>
    </article>
    <div class="point-layout__actions point-layout__actions--inline">
      <button class="button secondary" data-action="scan">Отсканировать QR код</button>
    </div>
    <p class="point-layout__hint"> Отсканируйте QR-код, чтобы открыть следующую часть маршрута</p>
</div>

    <div class="point-layout__route footer">
      <div class="footer__voice">
      <div class="logos-wrap">
            <div class="footer__voice__logo" aria-hidden="true"></div>
            <div class="footer__voice__media" aria-hidden="true"></div>
        </div>
        <div class="footer__subtitles" aria-live="polite"></div>
      </div>
      <div class="footer__button"></div>
    </div>
  `

  let footerAudio: HTMLAudioElement | null = null
    let hideAnimationCancel: (() => void) | null = null


  const footerVoice = card.querySelector<HTMLDivElement>('.footer__voice')
  const footerVoiceLogo = card.querySelector<HTMLDivElement>('.footer__voice__logo')


  if (footerVoice) {
      const logo =  document.createElement('div');
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

    footerVoiceLogo?.appendChild(logo);
    const subtitleWrapper = footerVoice.querySelector<HTMLDivElement>('.footer__subtitles')
    const subtitleText = document.createElement('p')
    subtitleText.className = 'footer__subtitle-text'
    const defaultSubtitleMessage = ''

      const mediaHost = footerVoice.querySelector<HTMLDivElement>('.footer__voice__media')

      let voiceVideo: HTMLVideoElement | null = null

      if (mediaHost) {
          voiceVideo = document.createElement('video')
          voiceVideo.className = 'footer__voice__video'
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

          mediaHost.replaceChildren(voiceVideo)
      }

      const startVoiceVideo = () => {
          voiceVideo?.play().catch(() => {})
      }

      const stopVoiceVideo = () => {
          if (!voiceVideo) return
          voiceVideo.pause()
          try { voiceVideo.currentTime = 0 } catch {}
      }

    const subtitleAnimationClasses = ['subtitle-animate-in', 'subtitle-animate-out'] as const

    let isSubtitleVisible = false
    let isSubtitleAnimatingOut = false

    const playSubtitleAnimation = (className: (typeof subtitleAnimationClasses)[number]) => {
      subtitleAnimationClasses.forEach((animationClass) => subtitleText.classList.remove(animationClass))

      void subtitleText.offsetWidth
      subtitleText.classList.add(className)
    }

    const animateSubtitleIn = () => {
      isSubtitleAnimatingOut = false
      isSubtitleVisible = true
      playSubtitleAnimation('subtitle-animate-in')
        startVoiceVideo()
    }

    const animateSubtitleOut = (onFinish?: () => void) => {
        if (isSubtitleAnimatingOut || !isSubtitleVisible) {
            if (onFinish) onFinish()
            return
        }

        isSubtitleAnimatingOut = true
        playSubtitleAnimation('subtitle-animate-out')

        let cancelled = false
        hideAnimationCancel = () => {
            cancelled = true
            hideAnimationCancel = null
        }

        const handleAnimationEnd = () => {
            subtitleText.removeEventListener('animationend', handleAnimationEnd)
            if (cancelled) return
            isSubtitleAnimatingOut = false
            hideAnimationCancel = null
            onFinish?.()
        }

        subtitleText.addEventListener('animationend', handleAnimationEnd)
    }

    const renderDefaultSubtitle = () => {
      subtitleText.replaceChildren()
      subtitleText.textContent = defaultSubtitleMessage
      subtitleWrapper?.classList.remove('footer__subtitles--visible')
      isSubtitleVisible = false
      isSubtitleAnimatingOut = false
    }

    const clearSubtitleContent = () => {
      subtitleText.replaceChildren()
      subtitleText.textContent = defaultSubtitleMessage
      subtitleWrapper?.classList.remove('footer__subtitles--visible')
      isSubtitleVisible = false
      isSubtitleAnimatingOut = false
        stopVoiceVideo()
    }

    // Hide the currently visible subtitle line. If nothing is shown, clear immediately;
    // otherwise trigger the hide animation and clean up once it finishes.
    const hideSubtitle = () => {
      if (!(subtitleText.textContent || '').trim().length) {
        clearSubtitleContent()
        return
      }

      animateSubtitleOut(clearSubtitleContent)
    }

    renderDefaultSubtitle()

    subtitleWrapper?.appendChild(subtitleText)

    const nextPointVoice = guideVoiceAssets[point.id]

    const audioSrc = nextPointVoice?.audio as string;
    const subtitlesUrl = nextPointVoice?.subtitles ?? null

    footerAudio = document.createElement('audio')
    footerAudio.className = 'footer__audio'
    footerAudio.src = audioSrc
    footerAudio.preload = 'auto'
    footerAudio.autoplay = state.soundEnabled
    footerAudio.muted = !state.soundEnabled

    let footerCues: SubtitleCue[] = []
    let activeCueIndex: number | null = null

    const subtitleTimeTolerance = 0.15

    const findActiveCueIndex = (current: number) =>
      footerCues.findIndex((cue) => {
        const cueStart = Math.max(0, cue.start - subtitleTimeTolerance)
        const cueEnd = cue.end + subtitleTimeTolerance

        return current >= cueStart && current < cueEnd
      })

    const renderSubtitleText = (text: string) => {
      subtitleText.replaceChildren()
      subtitleText.textContent = text.trim() ? text : defaultSubtitleMessage
    }

    const resetSubtitleState = () => {
      activeCueIndex = null
        stopVoiceVideo()
      hideSubtitle()
    }

    const showFinalCue = () => {
      if (!footerCues.length) return

      const lastCueIndex = footerCues.length - 1
      const lastCue = footerCues[lastCueIndex]
      const isAlreadyShowingLastCue =
        activeCueIndex === lastCueIndex && subtitleText.textContent === lastCue.text && isSubtitleVisible

      if (isAlreadyShowingLastCue) {
        subtitleWrapper?.classList.add('footer__subtitles--visible')
        return
      }

      activeCueIndex = lastCueIndex
      renderSubtitleText(lastCue.text)
      subtitleWrapper?.classList.add('footer__subtitles--visible')
        hideAnimationCancel?.()
        hideAnimationCancel = null
      animateSubtitleIn()
    }

    const updateSubtitles = () => {
      if (!subtitleWrapper || !footerCues.length) {
        renderDefaultSubtitle()
        return
      }

      const current = footerAudio?.currentTime || 0
      const activeIndexNext = findActiveCueIndex(current)

      if (activeIndexNext !== -1) {
        const activeCue = footerCues[activeIndexNext]

        if (activeCueIndex !== activeIndexNext) {
          activeCueIndex = activeIndexNext
          renderSubtitleText(activeCue.text)
            hideAnimationCancel?.()
            hideAnimationCancel = null
          animateSubtitleIn()
        }

        subtitleWrapper.classList.add('footer__subtitles--visible')
      } else if (footerAudio?.ended) {
        showFinalCue()
      } else {
          // if (isSubtitleVisible) return
        resetSubtitleState()
      }
    }

    footerAudio.addEventListener('timeupdate', updateSubtitles)
    footerAudio.addEventListener('seeked', updateSubtitles)
    footerAudio.addEventListener('play', updateSubtitles)
    footerAudio.addEventListener('ended', showFinalCue)

    if (subtitlesUrl) {
      loadSrtSubtitles(subtitlesUrl).then((cues) => {
        footerCues = cues
        updateSubtitles()
      })
    }

      footerVoice.appendChild(footerAudio)
      if (state.soundEnabled) {
        footerAudio
          .play()
          .then(() => updateSubtitles())
          .catch(() => {})
      }
    }

  const footerButton = card.querySelector<HTMLDivElement>('.footer__button')
  if (footerButton) {
    let isMuted = !state.soundEnabled

    const updateSoundToggle = () => {
      soundToggle.innerHTML = isMuted
        ? `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.4 16L14 14.6L16.6 12L14 9.4L15.4 8L18 10.6L20.6 8L22 9.4L19.4 12L22 14.6L20.6 16L18 13.4L15.4 16ZM3 15L3 9H7L12 4L12 20L7 15H3ZM10 8.85L7.85 11H5L5 13H7.85L10 15.15L10 8.85Z" fill="#E2E2E2"/>
</svg>
`
        : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 20.9141L6.08594 15H2L2 9H6.08594L12 3.08594L12 20.9141ZM14 3.22754C14.4922 3.33984 14.9758 3.49145 15.4443 3.68555C16.5361 4.13784 17.5286 4.8001 18.3643 5.63574C19.1999 6.47139 19.8622 7.46386 20.3145 8.55566C20.7667 9.64759 21 10.8181 21 12L20.9893 12.4424C20.9385 13.4732 20.7102 14.4888 20.3145 15.4443C19.8622 16.5361 19.1999 17.5286 18.3643 18.3643C17.5286 19.1999 16.5361 19.8622 15.4443 20.3145C14.9758 20.5085 14.4921 20.6592 14 20.7715L14 18.7061C14.2296 18.6375 14.4565 18.5588 14.6787 18.4668C15.528 18.115 16.3002 17.6002 16.9502 16.9502C17.6002 16.3002 18.115 15.528 18.4668 14.6787C18.8186 13.8294 19 12.9193 19 12C19 11.0807 18.8186 10.1706 18.4668 9.32129C18.115 8.47204 17.6002 7.6998 16.9502 7.0498C16.3002 6.39981 15.528 5.88499 14.6787 5.5332C14.4564 5.44112 14.2297 5.36151 14 5.29297V3.22754ZM14 7.41895C14.5722 7.66881 15.0932 8.02293 15.5352 8.46484C15.9994 8.92914 16.3679 9.48029 16.6191 10.0869C16.8704 10.6935 17 11.3435 17 12C17 12.6565 16.8704 13.3065 16.6191 13.9131C16.3679 14.5197 15.9994 15.0709 15.5352 15.5352C15.0933 15.977 14.5721 16.3302 14 16.5801V14.2305C14.0405 14.1942 14.0826 14.1596 14.1211 14.1211C14.3996 13.8426 14.6207 13.5123 14.7715 13.1484C14.9222 12.7845 15 12.394 15 12C15 11.606 14.9222 11.2155 14.7715 10.8516C14.6207 10.4877 14.3996 10.1574 14.1211 9.87891C14.0824 9.84023 14.0406 9.80499 14 9.76855L14 7.41895ZM6.91406 11H4L4 13H6.91406L10 16.0859L10 7.91406L6.91406 11Z" fill="#D9D9D9"/>
</svg>
`
      soundToggle.setAttribute('aria-pressed', String(!isMuted))
      soundToggle.setAttribute('aria-label', isMuted ? 'Включить звук' : 'Выключить звук')
      if (footerAudio) {
        footerAudio.muted = isMuted
        if (!isMuted) {
          footerAudio.play().catch(() => {})
        }
      }
    }

    const soundToggle = document.createElement('button')
    soundToggle.type = 'button'
    soundToggle.className = 'button primary icon-button'
    soundToggle.addEventListener('click', () => {
      isMuted = !isMuted
      state.soundEnabled = !isMuted
      saveSoundEnabled(!isMuted)
      updateSoundToggle()
    })

    updateSoundToggle()
    footerButton.replaceChildren(soundToggle)
  }

  card.querySelector<HTMLButtonElement>('[data-action="map"]')?.addEventListener('click', () => {
    state.currentFloor = point.map.floor
    openMapOverlay()
  })

  card.querySelector<HTMLButtonElement>('[data-action="scan"]')?.addEventListener('click', async () => {
    state.scannerExpectedPointIndex = state.currentPointIndex
    state.scannerOrigin = state.screen

    const permissionGranted = await hasCameraPermission(state.cameraPermissionGranted)

    if (permissionGranted) {
      state.cameraPermissionGranted = true
      saveCameraPermissionGranted()
      state.screen = 'scanner'
    } else {
      state.screen = 'cameraPermission'
    }

    rerender()
  })

  card.querySelector<HTMLButtonElement>('[data-action="route"]')?.addEventListener('click', () => {
    state.screen = 'routeList'
      state.routeMode = 'solo'
    rerender()
  })

    const onVisibility = () => {
        if (document.hidden) {
            footerAudio?.pause();
        } else {
            footerAudio?.play();
        }
    }
    document.addEventListener('visibilitychange', onVisibility)
    cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility))

  if (cleanups.length) {
    return {
      element: card,
      cleanup: () => cleanups.forEach((fn) => fn()),
    }
  }

  return card
}

export const renderRouteComplete = (): RenderResult => {
  const point = points[state.currentPointIndex]
  const headingText = 'Отличная работа!'
  const subtitleText = photoZonePoint.title
  const caption = 'Посетите в ИИ-фотозону на 1 этаже — там можно создать портрет в одном из мест. Не забудьте поделиться впечатлением о музее в соцсетях'

  const card = document.createElement('section')
  card.className = 'card card--point card--next card--complete'

  card.innerHTML = `
    <div class="point-layout__header">
      <div>
        <p class="point-layout__eyebrow">${headingText}</p>
        <h1 class="point-layout__title">${subtitleText}</h1>
      </div>
    </div>
    <article class="point-visual">
      <div class="point-visual__frame">
        <button class="button icon-with-button primary map-button" data-action="map">
        Открыть <br>
        карту
          <span class="icon-button__icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.35 20.7C4.01667 20.8333 3.70833 20.7958 3.425 20.5875C3.14167 20.3792 3 20.1 3 19.75L3 5.75C3 5.53333 3.0625 5.34167 3.1875 5.175C3.3125 5.00833 3.48333 4.88333 3.7 4.8L9 3L15 5.1L19.65 3.3C19.9833 3.16667 20.2917 3.20417 20.575 3.4125C20.8583 3.62083 21 3.9 21 4.25V12.675C20.75 12.2917 20.4542 11.9417 20.1125 11.625C19.7708 11.3083 19.4 11.0333 19 10.8V5.7L16 6.85L16 10C15.65 10 15.3083 10.0292 14.975 10.0875C14.6417 10.1458 14.3167 10.2333 14 10.35L14 6.85L10 5.45L10 18.525L4.35 20.7ZM5 18.3L8 17.15L8 5.45L5 6.45L5 18.3ZM16 18C16.5667 18 17.0375 17.8333 17.4125 17.5C17.7875 17.1667 17.9833 16.6667 18 16C18.0167 15.4333 17.8292 14.9583 17.4375 14.575C17.0458 14.1917 16.5667 14 16 14C15.4333 14 14.9583 14.1917 14.575 14.575C14.1917 14.9583 14 15.4333 14 16C14 16.5667 14.1917 17.0417 14.575 17.425C14.9583 17.8083 15.4333 18 16 18ZM16 20C14.9 20 13.9583 19.6083 13.175 18.825C12.3917 18.0417 12 17.1 12 16C12 14.9 12.3917 13.9583 13.175 13.175C13.9583 12.3917 14.9 12 16 12C17.1 12 18.0417 12.3917 18.825 13.175C19.6083 13.9583 20 14.9 20 16C20 16.3833 19.9542 16.7458 19.8625 17.0875C19.7708 17.4292 19.6333 17.75 19.45 18.05L22 20.6L20.6 22L18.05 19.45C17.75 19.6333 17.4292 19.7708 17.0875 19.8625C16.7458 19.9542 16.3833 20 16 20Z" fill="#E2E2E2"/>
            </svg>
          </span>
        </button>
        <div class="point-visual__placeholder" role="img" aria-label="${
          photoZonePoint.photoAlt || photoZonePoint.title
        }">
        <img src="${photoZonePoint.photoWhere}" alt="">
</div>
        <div class="point-visual__title">Хотите продолжить историю?</div>
        <p class="point-visual__caption">${caption}</p>
      </div>
    </article>
    <div class="point-layout__route footer">
      <div class="footer__voice">
         <div class="logos-wrap">
            <div class="footer__voice__logo" aria-hidden="true"></div>
            <div class="footer__voice__media" aria-hidden="true"></div>
        </div>
        <div class="footer__subtitles" aria-live="polite"></div>
      </div>
      <div class="footer__button"></div>
    </div>
  `

  let footerAudio: HTMLAudioElement | null = null

  const finishButton = createButton('Завершить', 'secondary')
  finishButton.addEventListener('click', () => {
      resetProgress()
    state.screen = 'routeList'
    rerender()
  })


  const footer = card.querySelector<HTMLDivElement>('.point-layout__route')
  const footerVoice = card.querySelector<HTMLDivElement>('.footer__voice')
    const footerVoiceLogo = card.querySelector<HTMLDivElement>('.footer__voice__logo')


    if (footerVoice) {
        const logo =  document.createElement('div');
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
            footerVoiceLogo?.appendChild(logo);

    const subtitleWrapper = footerVoice.querySelector<HTMLDivElement>('.footer__subtitles')
    const subtitleText = document.createElement('p')
    subtitleText.className = 'footer__subtitle-text'
    const defaultSubtitleMessage = ''

      const mediaHost = footerVoice.querySelector<HTMLDivElement>('.footer__voice__media')

      let voiceVideo: HTMLVideoElement | null = null

      if (mediaHost) {
          voiceVideo = document.createElement('video')
          voiceVideo.className = 'footer__voice__video'
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

          mediaHost.replaceChildren(voiceVideo)
      }

      const startVoiceVideo = () => {
          voiceVideo?.play().catch(() => {})
      }

      const stopVoiceVideo = () => {
          if (!voiceVideo) return
          voiceVideo.pause()
          try { voiceVideo.currentTime = 0 } catch {}
      }

    const subtitleAnimationClasses = ['subtitle-animate-in', 'subtitle-animate-out'] as const

    let isSubtitleVisible = false
    let isSubtitleAnimatingOut = false

    const playSubtitleAnimation = (className: (typeof subtitleAnimationClasses)[number]) => {
          startVoiceVideo();
      subtitleText.classList.remove(...subtitleAnimationClasses)
      subtitleText.getBoundingClientRect()
      subtitleText.classList.add(className)
    }

    const animateSubtitleIn = () => {
      isSubtitleAnimatingOut = false
      isSubtitleVisible = true
      playSubtitleAnimation('subtitle-animate-in')
        startVoiceVideo()
    }

    const renderFinishButton = () => {
      subtitleText.replaceChildren()
        footerVoice?.classList.add('footer__subtitles--visible')
        stopVoiceVideo()
        footer?.classList.add('footer__finishButton')
        footer?.replaceChildren(finishButton)
    }

    const animateSubtitleOut = (onFinish?: () => void) => {
      if (isSubtitleAnimatingOut || !isSubtitleVisible) {
        if (onFinish) onFinish()
        return
      }

      isSubtitleAnimatingOut = true
      playSubtitleAnimation('subtitle-animate-out')

      if (!onFinish) return

      const handleAnimationEnd = () => {
        subtitleText.removeEventListener('animationend', handleAnimationEnd)
        isSubtitleAnimatingOut = false
        onFinish()
      }

      subtitleText.addEventListener('animationend', handleAnimationEnd)
    }

    const renderDefaultSubtitle = () => {
      subtitleText.replaceChildren()
      subtitleText.textContent = defaultSubtitleMessage
      subtitleWrapper?.classList.remove('footer__subtitles--visible')
      isSubtitleVisible = false
      isSubtitleAnimatingOut = false
        stopVoiceVideo()
    }

    // Hide the completion subtitle line. If nothing is shown, reset immediately;
    // otherwise run the hide animation before clearing the text.
    const hideSubtitle = () => {
      if (!(subtitleText.textContent || '').trim().length) {
        renderDefaultSubtitle()
        return
      }

      animateSubtitleOut(renderDefaultSubtitle)
    }

    renderDefaultSubtitle()

    subtitleWrapper?.appendChild(subtitleText)

    const completionVoice = guideVoiceAssets.photo

    const audioSrc = completionVoice?.audio as string
    const subtitlesUrl = completionVoice?.subtitles ?? null

    footerAudio = document.createElement('audio')
    footerAudio.className = 'footer__audio'
    footerAudio.src = audioSrc
    footerAudio.preload = 'auto'
    footerAudio.autoplay = state.soundEnabled
    footerAudio.muted = !state.soundEnabled

    let footerCues: SubtitleCue[] = []
    let activeCueIndex: number | null = null

    const subtitleTimeTolerance = 0.15

    const findActiveCueIndex = (current: number) =>
      footerCues.findIndex((cue) => {
        const cueStart = Math.max(0, cue.start - subtitleTimeTolerance)
        const cueEnd = cue.end + subtitleTimeTolerance

        return current >= cueStart && current < cueEnd
      })

    const renderSubtitleText = (text: string) => {
      subtitleText.replaceChildren()
      subtitleText.textContent = text.trim() ? text : defaultSubtitleMessage
    }

    const resetSubtitleState = () => {
      activeCueIndex = null
      hideSubtitle()
    }

    const transitionToFinish = () => {
      animateSubtitleOut(renderFinishButton)
    }

    const updateSubtitles = () => {
      if (!subtitleWrapper || !footerCues.length) {
        renderDefaultSubtitle()
        return
      }

      const current = footerAudio?.currentTime || 0
      const activeIndexNext = findActiveCueIndex(current)

      if (activeIndexNext !== -1) {
        const activeCue = footerCues[activeIndexNext]

        if (activeCueIndex !== activeIndexNext) {
          activeCueIndex = activeIndexNext
          renderSubtitleText(activeCue.text)
          animateSubtitleIn()
        }

        subtitleWrapper.classList.add('footer__subtitles--visible')
      } else if (footerAudio?.ended) {
        transitionToFinish()
      } else {
        resetSubtitleState()
      }
    }

    footerAudio.addEventListener('timeupdate', updateSubtitles)
    footerAudio.addEventListener('seeked', updateSubtitles)
    footerAudio.addEventListener('play', updateSubtitles)
    footerAudio.addEventListener('ended', transitionToFinish)

    if (subtitlesUrl) {
      loadSrtSubtitles(subtitlesUrl).then((cues) => {
        footerCues = cues
        updateSubtitles()
      })
    }

    footerVoice.appendChild(footerAudio)
    if (state.soundEnabled) {
      footerAudio
        .play()
        .then(() => updateSubtitles())
        .catch(() => transitionToFinish())
    }
  }

  const footerButton = card.querySelector<HTMLDivElement>('.footer__button')
  if (footerButton) {
    let isMuted = !state.soundEnabled

    const updateSoundToggle = () => {
      soundToggle.innerHTML = isMuted
        ? `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.4 16L14 14.6L16.6 12L14 9.4L15.4 8L18 10.6L20.6 8L22 9.4L19.4 12L22 14.6L20.6 16L18 13.4L15.4 16ZM3 15L3 9H7L12 4L12 20L7 15H3ZM10 8.85L7.85 11H5L5 13H7.85L10 15.15L10 8.85Z" fill="#E2E2E2"/>
</svg>
`
        : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 20.9141L6.08594 15H2L2 9H6.08594L12 3.08594L12 20.9141ZM14 3.22754C14.4922 3.33984 14.9758 3.49145 15.4443 3.68555C16.5361 4.13784 17.5286 4.8001 18.3643 5.63574C19.1999 6.47139 19.8622 7.46386 20.3145 8.55566C20.7667 9.64759 21 10.8181 21 12L20.9893 12.4424C20.9385 13.4732 20.7102 14.4888 20.3145 15.4443C19.8622 16.5361 19.1999 17.5286 18.3643 18.3643C17.5286 19.1999 16.5361 19.8622 15.4443 20.3145C14.9758 20.5085 14.4921 20.6592 14 20.7715L14 18.7061C14.2296 18.6375 14.4565 18.5588 14.6787 18.4668C15.528 18.115 16.3002 17.6002 16.9502 16.9502C17.6002 16.3002 18.115 15.528 18.4668 14.6787C18.8186 13.8294 19 12.9193 19 12C19 11.0807 18.8186 10.1706 18.4668 9.32129C18.115 8.47204 17.6002 7.6998 16.9502 7.0498C16.3002 6.39981 15.528 5.88499 14.6787 5.5332C14.4564 5.44112 14.2297 5.36151 14 5.29297V3.22754ZM14 7.41895C14.5722 7.66881 15.0932 8.02293 15.5352 8.46484C15.9994 8.92914 16.3679 9.48029 16.6191 10.0869C16.8704 10.6935 17 11.3435 17 12C17 12.6565 16.8704 13.3065 16.6191 13.9131C16.3679 14.5197 15.9994 15.0709 15.5352 15.5352C15.0933 15.977 14.5721 16.3302 14 16.5801V14.2305C14.0405 14.1942 14.0826 14.1596 14.1211 14.1211C14.3996 13.8426 14.6207 13.5123 14.7715 13.1484C14.9222 12.7845 15 12.394 15 12C15 11.606 14.9222 11.2155 14.7715 10.8516C14.6207 10.4877 14.3996 10.1574 14.1211 9.87891C14.0824 9.84023 14.0406 9.80499 14 9.76855L14 7.41895ZM6.91406 11H4L4 13H6.91406L10 16.0859L10 7.91406L6.91406 11Z" fill="#D9D9D9"/>
</svg>
`
      soundToggle.setAttribute('aria-pressed', String(!isMuted))
      soundToggle.setAttribute('aria-label', isMuted ? 'Включить звук' : 'Выключить звук')
      if (footerAudio) {
        footerAudio.muted = isMuted
        if (!isMuted) {
          footerAudio.play().catch(() => {})
        }
      }
    }

    const soundToggle = document.createElement('button')
    soundToggle.type = 'button'
    soundToggle.className = 'button primary icon-button'
    soundToggle.addEventListener('click', () => {
      isMuted = !isMuted
      state.soundEnabled = !isMuted
      saveSoundEnabled(!isMuted)
      updateSoundToggle()
    })

    updateSoundToggle()
    footerButton.replaceChildren(soundToggle)
  }

  card.querySelector<HTMLButtonElement>('[data-action="map"]')?.addEventListener('click', () => {
    state.currentFloor = photoZonePoint.map.floor
    openMapOverlay({
      pointsOverride: [photoZonePoint],
      currentPointIndex: 0,
      initialFloor: photoZonePoint.map.floor,
    })
  })

    const onVisibility = () => {
        if (document.hidden) {
            footerAudio?.pause();
        } else {
            footerAudio?.play();
        }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return card
}
