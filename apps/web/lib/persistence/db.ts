import { z } from "zod"
import { newWorkerConnection } from "~/lib/worker"
//@ts-ignore
const worker = new Worker(
  new URL("../sqlite/sqlite-worker.js", import.meta.url),
  {
    type: "module",
  }
)

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
})

export type DocumentType = z.infer<typeof DocumentSchema>
export type DocumentCreateArgs = {
  data: Partial<DocumentType>
}

export type DocumentUpdateArgs = {
  data: Partial<DocumentType>
  where: Partial<DocumentType>
}

export type DocumentDeleteArgs = {
  where: Partial<DocumentType>
}

export interface DocumentAPI {
  "document.create": {
    payload: DocumentCreateArgs
    return: DocumentType
  }
  "document.update": {
    payload: DocumentUpdateArgs
    return: DocumentType
  }
  "document.delete": {
    payload: DocumentDeleteArgs
    return: boolean
  }
}

const connection = newWorkerConnection<DocumentAPI>(worker)

export const createDocument = (data: DocumentCreateArgs) =>
  connection.send("document.create", data)
export const updateDocument = (data: DocumentUpdateArgs) =>
  connection.send("document.update", data)
export const deleteDocument = (data: DocumentDeleteArgs) =>
  connection.send("document.delete", data)

export const db = {
  createDocument,
  updateDocument,
  deleteDocument,
}
