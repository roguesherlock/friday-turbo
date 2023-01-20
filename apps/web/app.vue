<script setup lang="ts">
import { clock } from "sync";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
const socket = ref<Socket | null>(null);
onMounted(() => {
  clock();
  socket.value = io("ws://localhost:4000", {
    auth: {
      email: "aakash@hey.com",
      deviceId: 1,
    },
  });
  console.log(socket.value);
  socket.value?.on?.("connect_error", (msg) => {
    console.error(msg);
  });
});
</script>
<template>
  <div>
    <NuxtWelcome />
  </div>
</template>
