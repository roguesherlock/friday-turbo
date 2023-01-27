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

  constructor() {
    this._timestamp = utcNow()
    this._counter = 0
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
      return
    }
    const now = utcNow()
    const timestamp = this._timestamp
    this._timestamp = max(now, timestamp)
    if ((this._timestamp = timestamp)) {
      this._counter += 1
    } else {
      this._counter = 0
    }
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

  unpack(clockString: string) {
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

export function isValidDate(d: unknown) {
  return typeof d === "number" && !isNaN(new Date(d).getTime())
}

export function max<T>(...args: T[]) {
  return args.reduce((pMax, curr) => (pMax > curr ? pMax : curr), args[0])
}

export function init(): Clock {
  return new Clock()
}
