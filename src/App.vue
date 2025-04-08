<script setup lang="ts">
import Sidebar from "./components/Sidebar.vue";
import NavBar from "./components/NavBar.vue";
import CommandPalette from "./components/CommandPalette.vue";
import { ref, onMounted, onUnmounted } from "vue";
import { tools } from "./tools";

const commandPalette = ref<InstanceType<typeof CommandPalette> | null>(null);

const navigationTools = tools.map((tool) => ({
  name: tool.title,
  path: `/${tool.slug}`,
  description: tool.description,
}));

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    commandPalette.value?.showModal();
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div class="flex flex-wrap bg-gray-50">
    <Sidebar class="hidden sm:grid" />
    <main
      class="basis-0 flex-grow-[999] min-h-screen p-3"
      style="min-inline-size: 60%"
    >
      <NavBar class="sm:hidden mb-2" />
      <div class="bg-white outline outline-gray-200 h-full px-4 py-3">
        <RouterView />
      </div>
    </main>

    <CommandPalette ref="commandPalette" :tools="navigationTools" />
  </div>
</template>
