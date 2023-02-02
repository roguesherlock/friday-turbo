import { initDB } from "~~/lib/persistence"
export default defineNuxtPlugin(async () => {
  const db = await initDB()
  return {
    provide: {
      db,
    },
  }
})
