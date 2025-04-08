<script setup lang="ts">
import { tools } from "../tools";
import { useToggle } from "@vueuse/core";

const [isOpen, toggle] = useToggle();
</script>
<template>
  <header class="grid basis-64 bg-white outline outline-gray-200 px-4 py-3">
    <div class="flex items-center justify-between">
      <div class="text-xs font-medium uppercase tracking-wider">
        <RouterLink to="/" class="underline">Tools</RouterLink>
        <span class="text-xs tracking-wide text-gray-600 mb-4">
          by
          <a class="underline" target="_blank" href="https://shivam.dev">
            shivam.dev
          </a>
        </span>
      </div>
      <button
        @click="() => toggle()"
        type="button"
        class="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors text-xs uppercase"
      >
        Menu
      </button>
    </div>

    <section :class="{ hidden: !isOpen }">
      <nav class="space-y-1 -mx-2 mt-3">
        <RouterLink
          v-for="tool in tools"
          :to="`/${tool.slug}`"
          class="block px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          active-class="text-gray-900 bg-gray-50 outline outline-gray-100"
        >
          {{ tool.title }}
        </RouterLink>
      </nav>
    </section>
  </header>
</template>
