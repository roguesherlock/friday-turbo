<script setup lang="ts">
// import { initSync } from "sync"
// import { io } from "socket.io-client"
// import type { Socket } from "socket.io-client"
// const socket = ref<Socket | null>(null)

import { createDocument, execO } from "~/lib/persistence"

const id = "a0db683b-5ccc-409c-abf0-2b274a998622"
const { data, isLoading } = useDocument(id)
watch(isLoading, () => {
  console.log(isLoading.value)
  console.log(data)
})

// const id = crypto.randomUUID()

// const a = await createDocument({ data: { documentId: id } })
// console.log(a)

onMounted(async () => {
  // console.log(await execO("select * from 'atoms'"))
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
