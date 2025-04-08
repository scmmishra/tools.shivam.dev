<script setup lang="ts">
import Sidebar from "./components/Sidebar.vue";
</script>

<template>
  <div class="flex bg-gray-50">
    <Sidebar />
    <main
      class="basis-0 flex-grow-[999] [min-inline-size_50%] min-h-screen p-3"
    >
      <div class="bg-white outline outline-gray-200 h-full px-4 py-3">
        <RouterView />
      </div>
    </main>
  </div>
</template>
