<script setup lang="ts">
import { tools, Category } from "../tools";

const groupedTools = Object.values(Category).map((category) => ({
  name: category.charAt(0).toUpperCase() + category.slice(1),
  tools: tools.filter((tool) => tool.category === category),
}));
</script>
<template>
  <aside class="sticky top-0 grid h-screen p-3 pr-0 basis-64">
    <div
      class="flex flex-col h-full bg-white outline outline-gray-200 px-4 py-3"
    >
      <RouterLink to="/" class="text-xl font-medium uppercase tracking-wider">
        Tools
      </RouterLink>

      <span class="text-xs tracking-wide text-gray-600 mb-4">
        by
        <a class="underline" target="_blank" href="https://shivam.dev">
          shivam.dev
        </a>
      </span>

      <nav class="space-y-6 mt-2">
        <div v-for="group in groupedTools" :key="group.name" class="space-y-1">
          <h3
            class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1"
          >
            {{ group.name }}
          </h3>
          <div class="-mx-2 space-y-0.5">
            <RouterLink
              v-for="tool in group.tools"
              :key="tool.slug"
              :to="`/${tool.slug}`"
              class="block px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              active-class="text-gray-900 bg-gray-50 outline outline-gray-100"
            >
              {{ tool.title }}
            </RouterLink>
          </div>
        </div>
      </nav>
    </div>
  </aside>
</template>
