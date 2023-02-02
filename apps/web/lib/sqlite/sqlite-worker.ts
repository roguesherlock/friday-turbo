//@ts-ignore
import initSqlite3 from "./sqlite3.mjs"
//@ts-ignore
import initSql from "./sql/init.sql?raw"
import { callHandler, hasHandler } from "../persistence/handlers.js"
import "../persistence/document.js"

const sqlite3 = await initSqlite3()
console.log(
  "sqlite3 version",
  sqlite3.capi.sqlite3_libversion(),
  sqlite3.capi.sqlite3_sourceid()
)

const db = new sqlite3.oo1.DB("friday.db", "ct")
db.exec({
  sql: initSql,
})

const handleMessage = async (event: any) => {
  const msg = event.data as Record<string, any>
  const { id, name, args } = msg
  if (hasHandler(name)) {
    const data = await callHandler(name, db, args)
    postMessage({
      id,
      type: "reply",
      result: data,
    })
  }
  switch (name) {
    case "": {
      return
    }
    default: {
      postMessage({
        id,
        type: "error",
        result: new Error("Invalid command!"),
      })
    }
  }
}

addEventListener("message", handleMessage)
postMessage({ type: "connect" })
