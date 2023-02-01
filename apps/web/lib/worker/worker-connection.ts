import logger from "~/lib/logger"

export enum WorkerState {
  STALE = 1,
  CONNECTING,
  CONNECTED,
  ERROR,
}

export type Message = Record<string, any> & {
  id: string
  type:
    | "reply"
    | "error"
    | "connect"
    | "app-init-failure"
    | "capture-exception"
    | "capture-breadcrumb"
    | "push"
    | `__${any}`
  result: any
}

type PromiseResolver = {
  resolve: (value: any) => void
  reject: (reason?: any) => void
}

type WorkerAPIOptions<T> = {
  [Property in keyof T]: {
    payload: any
    return: any
  }
}

class ReconstructedError extends Error {
  url: any
  line: any
  column: any
  constructor(message: any, stack: any, url: any, line: any, column: any) {
    super(message)
    this.name = this.constructor.name
    this.message = message

    Object.defineProperty(this, "stack", {
      get: function () {
        return "extended " + this._stack
      },
      set: function (value) {
        this._stack = value
      },
    })

    this.stack = stack
    this.url = url
    this.line = line
    this.column = column
  }
}

type CallbackFn = (...args: any[]) => any

export const newWorkerConnection = <T extends WorkerAPIOptions<T>>(
  worker: Worker,
  onOpen?: CallbackFn,
  onError?: CallbackFn
) => {
  const name = crypto.randomUUID()
  let state = WorkerState.STALE
  const replyHandlers = new Map<string, PromiseResolver>()
  const listeners = new Map<keyof T, CallbackFn[]>()
  let messageQueue = [] as any[]
  let globalWorker: Worker | null = null

  const connect = () => {
    worker.addEventListener("message", handleMessage)
    worker.addEventListener("error", handleError)
  }

  const disconnect = () => {
    worker.removeEventListener("message", handleMessage)
    worker.removeEventListener("error", handleError)
    state = WorkerState.STALE
    for (const h of replyHandlers.keys()) {
      replyHandlers.delete(h)
    }
    for (const l of listeners.keys()) {
      listeners.delete(l)
    }
    messageQueue = []
  }

  const send = <K extends keyof T>(
    name: K,
    args: T[K]["payload"],
    { catchErrors = false } = {}
  ) => {
    return new Promise<T[K]["return"]>((resolve, reject) => {
      const id = crypto.randomUUID()
      replyHandlers.set(id, { resolve, reject })
      if (globalWorker) {
        globalWorker.postMessage({
          id,
          name,
          args,
          catchErrors,
        })
      } else {
        messageQueue.push({
          id,
          name,
          args,
          catchErrors,
        })
      }
    })
  }

  const sendCatch = <K extends keyof T>(name: K, args: T[K]["payload"]) => {
    send(name, args, { catchErrors: true })
  }

  const listen = <K extends keyof T>(name: K, cb: (...args: any) => any) => {
    if (!listeners.get(name)) listeners.set(name, [])
    listeners.get(name)!.push(cb)
    return () => {
      const arr = listeners.get(name)!
      listeners.set(
        name,
        arr.filter((cb_) => cb_ !== cb)
      )
    }
  }

  const unlisten = <k extends keyof T>(name: k) => {
    listeners.set(name, [])
  }

  const handleMessage = async (event: any) => {
    const msg = event.data as Message

    switch (msg.type) {
      // The worker implementation implements its own concept of a
      // 'connect' event because the worker is immediately
      // available, but we don't know when the backend is actually
      // ready to handle messages.
      case "connect": {
        globalWorker = worker
        // Send any messages that were queued while closed
        if (messageQueue.length > 0) {
          messageQueue.forEach((msg) => worker.postMessage(msg))
          messageQueue = []
        }
        onOpen?.()
        return
      }
      case "app-init-failure": {
        state = WorkerState.ERROR
        onError?.(msg)
        return
      }
      case "capture-exception": {
        state = WorkerState.ERROR
        logger.log(
          msg.stack
            ? new ReconstructedError(
                msg.message,
                msg.stack,
                msg.url,
                msg.line,
                msg.column
              )
            : msg.exc
        )
        return
      }
      case "capture-breadcrumb": {
        state = WorkerState.ERROR
        logger.log(msg.data)
        return
      }
      case "error": {
        // An error happened while handling a message so cleanup the
        // current reply handler. We don't care about the actual error -
        // generic backend errors are handled separately and if you want
        // more specific handling you should manually forward the error
        // through a normal reply.
        const { id } = msg
        replyHandlers.delete(id)
        return
      }
      case "reply": {
        const { id, result } = msg

        const handler = replyHandlers.get(id)
        if (handler) {
          replyHandlers.delete(id)
          handler.resolve(result)
        }
        return
      }
      case "push": {
        const { name, args } = msg

        const listens = listeners.get(name)
        if (listens) {
          for (let i = 0; i < listens.length; i++) {
            const stop = listens[i](args)
            if (stop === true) {
              break
            }
          }
        }
        return
      }
      default: {
        // Ignore internal messages that start with __
        if (!msg.type.startsWith("__")) {
          throw new Error("Unknown message type: " + JSON.stringify(msg))
        }
      }
    }
  }
  const handleError = (err: any) => {
    logger.log(err)
  }
  return {
    name,
    state,
    connect,
    disconnect,
    send,
    sendCatch,
    listen,
    unlisten,
  }
}
