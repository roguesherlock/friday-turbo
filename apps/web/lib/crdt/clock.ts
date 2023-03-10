// https://adamwulf.me/2021/05/distributed-clocks-and-crdts/
// Here’s how the clock works:

// Initialize the clock with the current UTC timestamp and a counter of zero
// Whenever an event happens:
// If the current wall clock time is after the current HLC timestamp, then update the timestamp and reset the counter to zero
// If the current wall clock time is before or equal to the current HLC timestamp, leave the timestamp unchanged and increment the counter
// Whenever an event is received:
// if the local wall clock time is larger than both our HLC and the event’s HLC, then use that and reset the counter to 0, otherwise, the wall clock is at or before our time, so we can ignore it
// if our HLC timestamp is equal to the event’s HLC timestamp, set our counter to one more than the max of both our counters
// if our HLC timestamp is after the event’s HLC timestamp, keep our timestamp and increment our counter
// last, if the event’s HLC timestamp is larger than our timestamp, use it’s timestamp and set our counter to 1 larger than its count
export class Clock {
  private _timestamp: number
  private _counter: number

  constructor(timestamp?: number, counter?: number) {
    this._timestamp = timestamp ?? utcNow()
    this._counter = counter ?? 0
  }

  get timestamp() {
    return this._timestamp
  }

  get counter() {
    return this._counter
  }

  update(clock?: Clock) {
    if (clock) {
      this.updateWithOtherClock(clock)
      return this
    }
    const now = utcNow()
    const timestamp = this._timestamp
    this._timestamp = max(now, timestamp)
    if ((this._timestamp = timestamp)) {
      this._counter += 1
    } else {
      this._counter = 0
    }
    return this
  }

  updateWithOtherClock(otherClock: Clock) {
    const now = utcNow()
    const timestamp = this._timestamp
    this._timestamp = max(now, timestamp, otherClock.timestamp)
    switch (true) {
      case this._timestamp == timestamp && timestamp == otherClock.timestamp:
        this._counter = max(this._counter, otherClock._counter) + 1
        break
      case this._timestamp == timestamp:
        this._counter += 1
        break
      case this._timestamp == otherClock.timestamp:
        this._counter = otherClock.counter + 1
        break
      default:
        this._counter = 0
    }
  }

  static unpack(clockString: string) {
    const d = clockString.split("_")[0]
    if (isValidDate(d)) return d
    return null
  }

  pack() {
    return `${this._timestamp}_${this._counter}`
  }
}

function utcNow() {
  return Date.parse(new Date().toISOString())
}

function isValidDate(d: unknown) {
  return typeof d === "number" && !isNaN(new Date(d).getTime())
}

function max<T>(...args: T[]) {
  return args.reduce((pMax, curr) => (pMax > curr ? pMax : curr), args[0])
}

export const maxClock = (a: string, b: string) => {
  const [t1, c1] = a.split("_").map((d) => Number(d))
  const [t2, c2] = a.split("_").map((d) => Number(d))
  // sort desc
  return t1 > t2 && c1 > c2 ? -1 : 1
  // const clock1 = newClock(a)
  // const clock2 = newClock(b)
  // // sort desc
  // return clock1.timestamp > clock2.timestamp && clock1.counter > clock2.counter
  //   ? -1
  //   : 1
}

export function newClock(clockString?: string): Clock {
  if (clockString) {
    const [t, c] = clockString.split("_").map((d) => Number(d))
    if (isNaN(t) || isNaN(c)) throw new Error("Invalid clock string")
    return new Clock(t, c)
  }
  return new Clock()
}
export default Clock
