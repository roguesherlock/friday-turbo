import { newClock, Clock } from "./clock"
import { openDB, DBSchema } from "idb"
//@ts-ignore
import sqlWorker from "blob-url:./sqlite/sqlite-worker.js"

new Worker(sqlWorker, {
  type: "module",
})

let clock: Clock

export interface Atom {
  recordId: string
  objectId: string
  scopeId: string
  attribute: string
  value: any
  clock: string
  deviceId: string
}
interface FridayDB extends DBSchema {
  atoms: {
    value: Atom
    key: string
    indexes: {
      objectIndex: string
      scopeIndex: string
      scopeObjectIndex: string[]
      objectAttributeIndex: string[]
      objectAttributeClockIndex: string[]
    }
  }
}

export const db = await openDB<FridayDB>("friday-db", 1, {
  async upgrade(db, oldversion) {
    const atomsStore = await db.createObjectStore("atoms", {
      keyPath: "recordId",
      autoIncrement: true,
    })
    atomsStore.createIndex("objectIndex", "objectId")
    atomsStore.createIndex("scopeIndex", "scopeId")
    atomsStore.createIndex("scopeObjectIndex", ["scopeIdx", "objectId"])
    atomsStore.createIndex("objectAttributeIndex", ["objectId", "attribute"])
    atomsStore.createIndex(
      "objectAttributeClockIndex",
      ["objectId", "attribute", "clock"],
      {
        unique: true,
      }
    )
  },
})

const attributes = ["x", "y", "z"]
clock = newClock()
const deviceId = self.crypto.randomUUID()
const objectId = self.crypto.randomUUID()
const scopeId = self.crypto.randomUUID()
let atoms: Atom[] = []
// for (let i = 0; i < 100_000; i++) {
//   atoms.push({
//     recordId: self.crypto.randomUUID(),
//     objectId,
//     scopeId,
//     attribute: attributes.at(i % attributes.length) ?? "x",
//     value: i,
//     clock: clock.update().pack(),
//     deviceId,
//   })
// }
// const atoms: Atom[] = [
//   {
//     recordId: self.crypto.randomUUID(),
//     objectId,
//     scopeId,
//     attribute: "x",
//     value: 23,
//     clock: clock.pack(),
//     deviceId,
//   },
//   {
//     recordId: self.crypto.randomUUID(),
//     objectId,
//     scopeId,
//     attribute: "x",
//     value: 24,
//     clock: clock.update().pack(),
//     deviceId,
//   },
//   {
//     recordId: self.crypto.randomUUID(),
//     objectId,
//     scopeId,
//     attribute: "x",
//     value: 25,
//     clock: clock.update().pack(),
//     deviceId,
//   },
// ]
export async function initSync() {
  // console.log(atoms)
  // console.log(dbWorker)
  const tx = db.transaction("atoms", "readwrite")
  // await Promise.all(atoms.map((a) => tx.store.add(a)))
  // const index = tx.store.index("objectAttributeIndex")
  // console.log(await index.getAll(["18a32316-326c-4a3d-bbdf-b782d2572cba", "x"]))
  // const index = tx.store.index("objectIndex")
  // console.log(await index.get("d763efa8-d886-4523-b6ae-16bf2fa09975"))
  // for await (const cursor of index.iterate([
  //   "0349c3a3-3eea-4f6f-b5e3-683db5a9ec29",
  //   "x",
  // ])) {
  //   console.log(cursor)
  // }
}
