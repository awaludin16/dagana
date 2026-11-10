export async function requestPosDisplayMode(): Promise<{
  fullscreen: boolean
  landscape: boolean
}> {
  const root = document.documentElement
  const orientation = screen.orientation
  let fullscreen = Boolean(document.fullscreenElement)
  let landscape = false

  if (!fullscreen && typeof root.requestFullscreen === 'function') {
    try {
      await root.requestFullscreen()
      fullscreen = true
    } catch {
      fullscreen = false
    }
  }

  if (fullscreen && orientation && typeof orientation.lock === 'function') {
    try {
      await orientation.lock('landscape')
      landscape = true
    } catch {
      landscape = false
    }
  }

  return { fullscreen, landscape }
}
