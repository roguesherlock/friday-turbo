import { newWorkerConnection } from "~/lib/worker"
import type {
  DocumentAPI,
  DocumentCreateArgs,
  DocumentUpdateArgs,
  DocumentDeleteArgs,
  DocumentFindUniqueArgs,
} from "~/lib/persistence"
import "./sqlite"

export interface Atom {
  id: string
  recordId: string
  objectId: string
  scopeId: string
  attribute: string
  value: any
}

export interface Record {
  id: string
  recordId: string
  packId: string
  clock: string
  deviceId: string
  scopeId: string
  type: number
  ioDirection: number
  ioState: number
}

export interface VRecord extends Atom, Record {}

export const initDB = async () => {
  // //@ts-ignore
  const worker = new Worker(
    new URL("../sqlite/sqlite-worker.ts", import.meta.url),
    {
      type: "module",
    }
  )

  const connection = newWorkerConnection<DocumentAPI>(worker)
  connection.connect()

  const findUniqueDocument = (data: DocumentFindUniqueArgs) =>
    connection.send("document.find-unique", data)
  const createDocument = (data: DocumentCreateArgs) =>
    connection.send("document.create", data)
  const updateDocument = (data: DocumentUpdateArgs) =>
    connection.send("document.update", data)
  const deleteDocument = (data: DocumentDeleteArgs) =>
    connection.send("document.delete", data)

  return {
    findUniqueDocument,
    createDocument,
    updateDocument,
    deleteDocument,
  }
}
