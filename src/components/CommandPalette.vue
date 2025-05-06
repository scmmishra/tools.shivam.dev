<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { picoSearch } from "@scmmishra/pico-search";

const props = defineProps<{
  tools: Array<{
    name: string;
    path: string;
    description: string;
  }>;
}>();

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();
const commandPalette = ref<HTMLDialogElement | null>(null);
const searchQuery = ref("");
const selectedIndex = ref(0);

const filteredTools = computed(() => {
  const query = searchQuery.value.toLowerCase();
  if (!query) {
    return props.tools;
  }
  return picoSearch(props.tools, query, ["name", "description"], {
    threshold: 0.8,
  });
});

function close() {
  commandPalette.value?.close();
  emit("close");
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    close();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIndex.value =
      (selectedIndex.value + 1) % filteredTools.value.length;
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIndex.value =
      selectedIndex.value - 1 < 0
        ? filteredTools.value.length - 1
        : selectedIndex.value - 1;
  } else if (e.key === "Enter" && filteredTools.value.length > 0) {
    const selectedTool = filteredTools.value[selectedIndex.value];
    router.push(selectedTool.path);
    close();
  }
}

defineExpose({
  showModal: () => {
    searchQuery.value = "";
    selectedIndex.value = 0;
    commandPalette.value?.showModal();
  },
});
</script>

<template>
  <dialog
    ref="commandPalette"
    class="fixed text-sm top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] rounded-lg p-0 backdrop:bg-gray-800/50"
    @click:outside="close"
    @keydown="handleKeydown"
  >
    <div class="border-b border-gray-200 p-3">
      <div class="flex items-center gap-2 text-gray-400">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search tools..."
          class="w-full bg-transparent outline-none text-gray-900"
          autofocus
        />
        <kbd
          class="hidden sm:inline-flex items-center gap-1 rounded outline outline-gray-200 bg-gray-100 px-2 py-0.5 text-xs text-gray-400"
        >
          esc
        </kbd>
      </div>
    </div>
    <div class="max-h-[20rem] overflow-y-auto p-2">
      <div
        v-for="(tool, index) in filteredTools"
        :key="tool.path"
        @click="
          () => {
            router.push(tool.path);
            close();
          }
        "
        :class="[
          'px-3 py-2 rounded-md cursor-pointer',
          selectedIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50',
        ]"
      >
        <div class="font-normal">{{ tool.name }}</div>
      </div>
      <div
        v-if="filteredTools.length === 0"
        class="px-3 py-2 text-gray-500 text-sm"
      >
        No tools found
      </div>
    </div>
  </dialog>
</template>

<style>
dialog::backdrop {
  background: rgba(0, 0, 0, 0.1);
}
</style>
