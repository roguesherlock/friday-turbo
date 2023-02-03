import { z } from "zod"
import { IO_TYPE, IO_STATE, IO_DIRECTION } from "~/lib/sync/constants"
import { getDeviceClock, getDeviceId, maxClock } from "~/lib/crdt"
import logger from "../logger"
import * as Comlink from "comlink"
// @ts-ignore -- todo
import DBWorker from "@vlcn.io/crsqlite-wasm/dist/comlinked?worker"
import { API } from "@vlcn.io/crsqlite-wasm/dist/comlinkable"
// @ts-ignore -- todo
import initSql from "./sql/init.sql?raw"

// @ts-ignore
import wasmUrl from "@vlcn.io/crsqlite-wasm/dist/sqlite3.wasm?url"
// @ts-ignore
import proxyUrl from "@vlcn.io/crsqlite-wasm/dist/sqlite3-opfs-async-proxy.js?url"

export const DocumentSchema = z.object({
  documentId: z.string().uuid(),
  title: z.string().optional(),
  content: z.any(),
})

export type DocumentType = z.infer<typeof DocumentSchema>
export type DocumentFindUniqueArgs = {
  where: Partial<DocumentType>
}
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
  "document.find-unique": {
    payload: DocumentFindUniqueArgs
    return: DocumentType
  }
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

export interface Atom {
  id: string
  recordId: string
  documentId: string
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

const sqlite = Comlink.wrap<API>(new DBWorker())
export let db: number | null = null
const waitForDB = async () =>
  new Promise((resolve) => {
    if (db) return resolve(db)
    let tries = 0
    const i = setInterval(() => {
      if (db) {
        clearInterval(i)
        return resolve(db)
      }
      if (tries > 10) throw new Error("Waited too long for DB to be ready")
      tries++
    }, 1000)
  })

async function onReady() {
  logger.log("ready")
  db = await sqlite.open("domedb.db")
  let initialized = false
  try {
    const meta = (await sqlite.execO(db!, "select * from meta")) as any[]
    meta.forEach((row) => {
      if (row.attribute === "initialized" && row.value === "1")
        initialized = true
    })
  } catch (e) {
    logger.log(e)
  }
  if (!initialized) {
    await sqlite.exec(db!, initSql)
    await sqlite.execO(
      db!,
      "insert into meta (attribute, value) values ('initialized', '1')"
    )
  }
  // await sqlite.transaction(db!, async () => {
  //   await sqlite.exec(db!, initSql)
  //   await sqlite.exec(
  //     db!,
  //     "insert into meta (attribute, value) values ('initialized', '1')"
  //   )
  // })
}

function onError(e: any) {
  console.error(e)
}

sqlite.onReady(
  {
    wasmUrl: wasmUrl,
    proxyUrl: proxyUrl,
  },
  Comlink.proxy(onReady),
  Comlink.proxy(onError)
)

export const findUniqueDocument = async (data: DocumentFindUniqueArgs) => {
  await waitForDB()
  try {
    //@ts-ignore
    const resultRows = await sqlite.execO<DocumentType>(
      db!,
      `SELECT "records".*,
              "documentId",
              "attribute",
              "value",
              "hint"
      FROM "records"
      LEFT OUTER JOIN "atoms" ON ("records"."recordId" = "atoms"."recordId")
      WHERE documentId = (?);`,

      [data.where.documentId]
      // todo -- write a sqlite function to calculate the clock to use this
      //     sql: `SELECT *
      //       FROM (
      //         SELECT attribute, value, recordId, MAX(clock) as max_clock
      //         FROM "records"
      //         LEFT OUTER JOIN "atoms" ON ("records"."recordId" = "atoms"."recordId")
      //         WHERE documentId = (?)
      //         GROUP BY attribute
      //       ) subquery
      //       JOIN atoms ON
      //         atoms.attribute = subquery.attribute AND
      //         atoms.clock = subquery.max_clock;
      // `,
    )
    return latestData(resultRows) as Required<DocumentType>
  } catch (e) {
    logger.log("Error whiling finding unique document", e)
    return null
  }
}
export const createDocument = async (data: DocumentCreateArgs) => {
  await waitForDB()
  const documentData = await DocumentSchema.parse(data.data)
  const documentId = crypto.randomUUID()

  try {
    await sqlite.transaction(
      db!,
      Comlink.proxy(async () => {
        const attributes = ["title", "content"] as Array<keyof DocumentType>
        attributes.forEach(async (attribute) => {
          const recordId = crypto.randomUUID()
          await sqlite.execO(
            db!,
            `insert into atoms(recordId,documentId,attribute,value) values (?,?,?,?)`,
            [recordId, documentId, attribute, documentData[attribute]]
          )
          await sqlite.execO(
            db!,
            "insert into records(recordId,clock,deviceId,type,ioDirection,ioState) values (?,?,?,?,?,?)",
            [
              recordId,
              getDeviceClock(),
              getDeviceId(),
              IO_TYPE.DATA,
              IO_DIRECTION.OUTBOUND,
              IO_STATE.INITIAL,
            ]
          )
        })
      })
    )
    return { ...documentData, documentId } as Required<DocumentType>
  } catch (e) {
    logger.log("Error whiling creating document", e)
    return null
  }
}
export const updateDocument = async (data: DocumentUpdateArgs) => {
  await waitForDB()
  let documentData: DocumentType
  try {
    documentData = await DocumentSchema.parse(data.data)
  } catch (e) {
    logger.log("Error whiling updating document", e)
    return
  }

  const documentId = data.where.documentId
  if (!documentId) throw new Error("Requires id")
  try {
    await sqlite.transaction(
      db!,
      Comlink.proxy(async () => {
        const attributes = ["title", "content"] as Array<keyof DocumentType>
        attributes.forEach(async (attribute) => {
          if (!documentData[attribute]) return
          const recordId = crypto.randomUUID()
          await sqlite.execO(
            db!,
            `insert into atoms(recordId,documentId,attribute,value) values (?,?,?,?)`,
            [recordId, documentId, attribute, documentData[attribute]]
          )
          await sqlite.exec(
            db!,
            "insert into records(recordId,clock,deviceId,type,ioDirection,ioState) values (?,?,?,?,?,?)",
            [
              recordId,
              getDeviceClock(),
              getDeviceId(),
              IO_TYPE.DATA,
              IO_DIRECTION.OUTBOUND,
              IO_STATE.INITIAL,
            ]
          )
        })
      })
    )
    return documentData as Required<DocumentType>
  } catch (e) {
    logger.log("Error whiling updating document", e)
    return null
  }
}
export const deleteDocument = (data: DocumentDeleteArgs) => {}

export const exec = async (sql: string, bind?: unknown[]) => {
  await waitForDB()
  return await sqlite.exec(db!, sql, bind)
}

export const execO = async (sql: string, bind?: unknown[]) => {
  await waitForDB()
  return await sqlite.execO(db!, sql, bind)
}

const latestData = (rows: any[]) => {
  const data = groupByAttribute(rows)
  return Object.keys(data).reduce(
    (acc, key) => {
      acc[key] =
        data[key].length > 0
          ? data[key]
              .sort((a: VRecord, b: VRecord) => maxClock(a.clock, b.clock))
              .at(-1).value
          : null
      return acc
    },
    { documentId: rows[0].documentId } as any
  )
}

const groupByAttribute = (rows: any[]) => {
  if (!rows.length) return {}
  return rows.reduce((acc, row) => {
    acc[row.attribute] = acc[row.attribute] || []
    acc[row.attribute].push(row)
    return acc
  }, {} as any)
}
