import logger from "./logger"

export enum WorkerState {
  STALE = 1,
  CONNECTING,
  CONNECTED,
  ERROR,
}

export type Message = {
  id: string
  type: string
  result: any
}

export type MessageRequest = Omit<Message, "result"> & {
  args: any
}

// /**
//  * WorkerConnectionInterface
//  * Represents the public facing api for the worker connection
//  */
// export interface WorkerConnectionInterface<T> {
//   connect: () => Promise<boolean>
//   disconnect: () => void
//   send: (name: keyof T, args?: keyof T) => Promise<T>
//   ping: () => "pong"
// }

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

export const newWorkerConnection = <T extends WorkerAPIOptions<T>>(
  worker: Worker
) => {
  const name = crypto.randomUUID()
  let state = WorkerState.STALE
  const receiveHandlers = new Map<string, PromiseResolver>()
  const connect = () => {
    worker.addEventListener("message", handleMessage)
    worker.addEventListener("error", handleError)
  }
  const disconnect = () => {
    worker.removeEventListener("message", handleMessage)
    worker.removeEventListener("error", handleError)
    state = WorkerState.STALE
  }

  const send = <K extends keyof T>(type: K, params: T[K]["payload"]) => {
    const message: MessageRequest = {
      id: crypto.randomUUID(),
      type: type as string,
      args: params ?? {},
    }
    return new Promise<T[K]["return"]>((resolve, reject) => {
      receiveHandlers.set(message.id, { resolve, reject })
      worker.postMessage(message)
    })
  }

  const handleMessage = async (event: any) => {
    const { id, result, type } = event.data as Message
    const handlers = receiveHandlers.get(id)
    if (!handlers) {
      logger.log(
        `WorkerConnection<${name}>.handleMessage(): Message resolver not found`,
        event
      )
      return
    }
    if (type === "success") {
      handlers.resolve(result)
    } else {
      handlers.reject(result)
    }
  }
  const handleError = (err: any) => {
    logger.log(err)
  }
  return {
    state,
    connect,
    disconnect,
    send,
  }
}

// /**
//  * Worker Connection encapsulates a worker connection
//  */
// export class WorkerConnection<T> implements WorkerConnectionInterface<T> {
//   state: WorkerState
//   readonly name: string
//   private receiveHandlers: Map<string, PromiseResolver>
//   private worker: Worker
//   constructor(worker: Worker) {
//     this.name = crypto.randomUUID()
//     this.state = WorkerState.STALE
//     this.receiveHandlers = new Map()
//     this.worker = worker
//     this.connect()
//   }

//   connect(force = false) {
//     if (!force && this.state === WorkerState.CONNECTED) {
//       return Promise.resolve(true)
//     }
//     this.disconnect()
//     this.worker.addEventListener("message", this.handleMessage.bind(this))
//     this.worker.addEventListener("error", this.handleError.bind(this))
//     return Promise.resolve(true)
//   }

//   disconnect() {
//     this.worker.removeEventListener("message", this.handleMessage)
//   }

//   send = (name, args) => {
//     const message: MessageRequest = {
//       id: crypto.randomUUID(),
//       type: name,
//       args: args ?? {},
//     }
//     return new Promise((resolve, reject) => {
//       this.receiveHandlers.set(message.id, { resolve, reject })
//       this.worker.postMessage(message)
//     })
//   }

//   ping() {
//     return "pong" as const
//   }

//   async handleMessage(event: any) {
//     const { id, result, type } = event.data as Message
//     const handlers = this.receiveHandlers.get(id)
//     if (!handlers) {
//       logger.log(
//         `WorkerConnection<${this.name}>.handleMessage(): Message resolver not found`,
//         event
//       )
//       return
//     }
//     if (type === "success") {
//       handlers.resolve(result)
//     } else {
//       handlers.reject(result)
//     }
//   }
//   async handleError(err: any) {
//     logger.log(err)
//   }
// }
