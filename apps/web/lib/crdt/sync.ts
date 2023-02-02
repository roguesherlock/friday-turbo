import { newClock } from "./clock"

const clock = newClock()
export const getDeviceId = () => {
  return 1
}

export const getDeviceClock = () => {
  const time = clock.pack()
  clock.update()
  return time
}
