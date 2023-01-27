import { newClock } from "./clock"
import { openDB, DBSchema } from "idb"

let clock

export interface Atom {
  objectId: string
  scopeId: string
  attribute: string
  clock: Date
  deviceId: string
}
interface FridayDB extends DBSchema {
  atoms: {
    value: Atom
    key: string
  }
}

export const db = await openDB<FridayDB>("friday-db", 1, {
  async upgrade(db, oldversion) {
    const atomsStore = await db.createObjectStore("atoms", {
      keyPath: "objectId",
    })
  },
})

function iniSync() {
  clock = newClock()
}
