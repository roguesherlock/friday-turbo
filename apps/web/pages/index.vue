<script setup lang="ts">
definePageMeta({
  middleware: async (to, from) => {
    if (from.path === "/") {
      return navigateTo(`/~/`)
    }
  },
})
</script>
<template>
  <div></div>
</template>
