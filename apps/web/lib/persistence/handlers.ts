type Fn<T, K = any> = (db: any, args: T) => Promise<K>
const handlers = new Map<string, any>()

export const registerHandler = <T, K = any>(name: string, fn: Fn<K>) => {
  handlers.set(name, fn)
  console.log(handlers)
}

export const hasHandler = (name: string) => {
  console.log(handlers)
  return handlers.has(name)
}

export const callHandler = (name: string, ...args: any[]) => {
  if (!handlers.get(name))
    throw new Error(`No handler with the name ${name} found`)
  return handlers.get(name)!(...args)
}
