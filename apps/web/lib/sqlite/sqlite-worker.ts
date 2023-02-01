import initSqlite3 from "./sqlite3.mjs"
//@ts-ignore
import initSql from "./sql/init.sql"
import { DocumentAPI, DocumentSchema } from "~/lib/persistence/db.js"

const sqlite3 = await initSqlite3()
console.log(
  "sqlite3 version",
  sqlite3.capi.sqlite3_libversion(),
  sqlite3.capi.sqlite3_sourceid()
)
sqlite3.initWorker1API()
const db = new sqlite3.oo1.DB("/friday.sqlite3", "ct")

db.exec(initSql)

const handleMessage = async (event: any) => {
  const msg = event.data as Record<string, any>
  const { id, name, catchErrors } = msg
  switch (name) {
    case "document.create": {
      return
    }
    default: {
      return {
        id,
        type: "error",
        result: new Error("Invalid command!"),
      }
    }
  }
}

addEventListener("message", handleMessage)
