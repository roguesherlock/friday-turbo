import { z } from "zod"
import { registerHandler } from "./handlers"
import { IO_TYPE, IO_STATE, IO_DIRECTION } from "~/lib/sync/constants"
import { getDeviceClock, getDeviceId } from "~/lib/crdt"
import { VRecord } from "./db"
import logger from "../logger"

export const DocumentSchema = z.object({
  id: z.string().uuid(),
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

registerHandler<DocumentFindUniqueArgs>(
  "document.find-unique",
  async (db, data) => {
    const documentId = data.where.id
    const documentData: DocumentType = {} as DocumentType

    return new Promise((resolve, reject) => {
      try {
        // eslint-disable-next-line prefer-const
        let resultRows: Array<VRecord> = []
        db.exec({
          sql: `
          select * from "records"
      `,
          //     sql: `
          //         SELECT attribute, value, MAX(clock) as max_clock
          //         FROM "records"
          //         LEFT OUTER JOIN "atoms" ON ("records"."recordId" = "atoms"."recordId")
          //         WHERE objectId = (?)
          //         GROUP BY attribute
          // `,
          //     sql: `SELECT *
          //       FROM (
          //         SELECT attribute, value, recordId, MAX(clock) as max_clock
          //         FROM "records"
          //         LEFT OUTER JOIN "atoms" ON ("records"."recordId" = "atoms"."recordId")
          //         WHERE objectId = (?)
          //         GROUP BY attribute
          //       ) subquery
          //       JOIN atoms ON
          //         atoms.attribute = subquery.attribute AND
          //         atoms.clock = subquery.max_clock;
          // `,
          bind: [documentId],
          rowMode: "object",
          resultRows: resultRows,
          callback: function (result) {
            console.log(result)
          },
        })
        resultRows.forEach((row) => {
          documentData[row.attribute as keyof DocumentType] = row.value
        })
        return resolve(documentData)
      } catch (e) {
        logger.log("Error whiling finding unique document", e)
        reject(e)
      }
    })
  }
)

registerHandler<DocumentCreateArgs>("document.create", async (db, data) => {
  const documentData = await DocumentSchema.parse(data.data)
  const documentId = crypto.randomUUID()

  return new Promise((resolve, reject) => {
    try {
      const document = db.transaction(function (D: any) {
        const attributes = ["title", "content"] as Array<keyof DocumentType>
        attributes.forEach((attribute) => {
          const recordId = crypto.randomUUID()
          D.exec({
            sql: `insert into atoms(recordId,objectId,attribute,value) values ($recordId,$objectId,$attribute,$value)`,
            bind: {
              $recordId: recordId,
              $objectId: documentId,
              $attribute: attribute,
              $value: documentData[attribute],
            },
          })
          D.exec({
            sql: "insert into records(recordId,clock,deviceId,type,ioDirection,ioState) values ($recordId,$clock,$deviceId,$type,$ioDirection,$ioState)",
            bind: {
              $recordId: recordId,
              $clock: getDeviceClock(),
              $deviceId: getDeviceId(),
              $type: IO_TYPE.DATA,
              $ioDirection: IO_DIRECTION.OUTBOUND,
              $ioState: IO_STATE.INITIAL,
            },
            callback: function (result) {
              console.log("yo", result)
            },
          })
        })
        return { documentData, id: documentId }
      })
      resolve(document)
    } catch (e) {
      logger.log("Error whiling creating document", e)
      reject(e)
    }
  })
})
registerHandler<DocumentUpdateArgs>("document.update", async (db, data) => {
  const documentData = await DocumentSchema.parse(data.data)
  const documentId = data.where.id
  if (!documentId) throw new Error("Requires id")
  return new Promise((resolve, reject) => {
    try {
      const document = db.transaction(function (D: any) {
        const attributes = ["title", "content"] as Array<keyof DocumentType>
        attributes.forEach((attribute) => {
          const recordId = crypto.randomUUID()
          D.exec({
            sql: `insert into atoms(recordId,objectId,attribute,value) values ($recordId,$objectId,$attribute,$value)`,
            bind: {
              $recordId: recordId,
              $objectId: documentId,
              $attribute: attribute,
              $value: documentData[attribute],
            },
          })
          D.exec({
            sql: "insert into records(recordId,clock,deviceId,type,ioDirection,ioState) values ($recordId,$clock,$deviceId,$type,$ioDirection,$ioState)",
            bind: {
              $recordId: recordId,
              $clock: getDeviceClock(),
              $deviceId: getDeviceId(),
              $type: IO_TYPE.DATA,
              $ioDirection: IO_DIRECTION.OUTBOUND,
              $ioState: IO_STATE.INITIAL,
            },
          })
        })
        return documentData
      })
      resolve(document)
    } catch (e) {
      logger.log("Error whiling updating document", e)
      reject(e)
    }
  })
})
