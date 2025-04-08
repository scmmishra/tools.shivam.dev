<script setup lang="ts">
import { computed } from "vue";
import { tools, Tools } from "../tools";

const props = defineProps<{
  name: Tools;
  persistKeys?: string[];
}>();

const currentTool = computed(() =>
  tools.find((tool) => tool.slug === props.name)
);

const clearCache = () => {
  if (!props.persistKeys?.length) return;

  props.persistKeys.forEach((key) => {
    localStorage.removeItem(key);
  });

  // Force reload to reset all form values
  window.location.reload();
};
</script>

<template>
  <div class="max-w-3xl flex flex-col h-full gap-6 justify-between">
    <section class="space-y-6 flex-grow">
      <div>
        <h1 class="text-xl font-medium tracking-wider truncate">
          {{ currentTool?.title }}
        </h1>
        <div class="text-gray-600 max-w-xl mt-2">
          <slot name="description">
            <p v-if="currentTool?.description">
              {{ currentTool?.description }}
            </p>
          </slot>
        </div>
      </div>

      <slot></slot>
    </section>

    <div v-if="persistKeys?.length">
      <button
        @click="clearCache"
        class="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1.5 cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="size-3"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path
            d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"
          />
          <path
            d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"
          />
        </svg>
        Clear saved data
      </button>
    </div>
  </div>
</template>
