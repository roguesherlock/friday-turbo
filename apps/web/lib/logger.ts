export const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const

type LEVEL = (typeof LogLevel)[keyof typeof LogLevel]

export type loggerOptions = {
  level?: LEVEL
}

const defaultLogLevel: LEVEL = import.meta.env.dev
  ? LogLevel.DEBUG
  : LogLevel.INFO
const defaultOptions: loggerOptions = {
  level: defaultLogLevel,
}
const newLogger = ({ level }: loggerOptions = defaultOptions) => {
  const currentLogLevel = level ?? defaultLogLevel
  const log = (...args: any[]) => {
    const level = args.at(-1) as unknown
    let num: LEVEL = LogLevel.DEBUG
    if (
      level &&
      typeof level === "string" &&
      Object.keys(LogLevel).includes(level)
    ) {
      num = LogLevel[level as keyof typeof LogLevel]
    }
    if (num <= currentLogLevel) {
      console.log(...args)
    }
  }

  return {
    log,
  }
}

const logger = newLogger()
export default logger
