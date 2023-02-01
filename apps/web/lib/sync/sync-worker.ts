import logger from "~~/lib/logger"
const SyncState = new Map()

export const init = () => {
  logger.log("SyncWorker.init()")
}

export default {
  init,
}
