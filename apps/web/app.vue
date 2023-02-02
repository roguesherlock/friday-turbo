<script setup lang="ts">
// import { initSync } from "sync"
// import { io } from "socket.io-client"
// import type { Socket } from "socket.io-client"
// const socket = ref<Socket | null>(null)

// const { data, isLoading } = useDocument("dcf3ac64-73fc-428c-9aa5-20d26a5d32fa")
// watch(isLoading, () => {
//   console.log(isLoading.value)
//   console.log(data.value)
// })

const { $db } = useNuxtApp()
const id = crypto.randomUUID()
const a = await $db.createDocument({ data: { id } })
console.log(a)
// const document = useDocument(id)

onMounted(async () => {
  // initSync()
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
})
</script>
<template>
  <div>
    <NuxtWelcome />
  </div>
</template>
