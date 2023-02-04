import logger from "~~/lib/logger"
// import { io } from "socket.io-client"
// import type { Socket } from "socket.io-client"
// const socket = ref<Socket | null>(null)
// socket.value = io("ws://localhost:4000", {
//   auth: {
//     email: "aakash@hey.com",
//     deviceId: 1,
//   },
// });
// console.log(socket.value);
// socket.value?.on?.("connect_error", (msg) => {
//   console.error(msg);
// });
const SyncState = new Map()

export const init = () => {
  logger.log("SyncWorker.init()")
}

export default {
  init,
}
