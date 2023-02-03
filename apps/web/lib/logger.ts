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

const defaultLogLevel: LEVEL = LogLevel.DEBUG
const defaultOptions: loggerOptions = {
  level: defaultLogLevel,
}
const newLogger = ({ level }: loggerOptions = defaultOptions) => {
  const currentLogLevel = level ?? defaultLogLevel
  const log = (...args: any[]) => {
    const logOptions = args.at(-1) as unknown
    let num: LEVEL = LogLevel.DEBUG
    if (
      logOptions &&
      typeof logOptions === "object" &&
      logOptions.level &&
      typeof logOptions.level === "string" &&
      Object.keys(LogLevel).includes(logOptions.level)
    ) {
      num = LogLevel[logOptions.level as keyof typeof LogLevel]
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
