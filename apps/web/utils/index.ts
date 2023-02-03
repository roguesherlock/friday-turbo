type Fn = (...args: any[]) => any
export const throttle = (func: Fn, timeFrame: number) => {
  let lastTime = 0
  return function (...args: any[]) {
    const now = new Date().getTime()
    if (now - lastTime >= timeFrame) {
      func(...args)
      lastTime = now
    }
  }
}

export const debounce = (func: Fn, timeFrame: number) => {
  let timeoutId: number | null = null
  return (...args: any[]) => {
    timeoutId && window.clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => {
      func(...args)
    }, timeFrame)
  }
}
