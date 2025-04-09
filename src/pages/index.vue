<script setup lang="ts">
import { RouterLink } from "vue-router";
import IconArrowRight from "~icons/ph/arrow-right";
import IconGithubLogo from "~icons/ph/github-logo";

import { tools } from "../tools";
</script>

<template>
  <div class="max-w-4xl">
    <div class="space-y-6">
      <div class="space-y-2">
        <h1 class="text-xl font-medium tracking-wider">Developer Tools</h1>
        <p class="text-gray-600 max-w-xl mt-2">
          A collection of useful developer tools that run entirely in your
          browser. Your data never leaves your device.
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-4">
        <RouterLink
          v-for="tool in tools"
          :to="`/${tool.slug}`"
          class="group block space-y-2 p-4 bg-white outline outline-gray-200 hover:outline-gray-300 hover:bg-gray-50"
        >
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-gray-900">{{ tool.title }}</h2>
            <IconArrowRight
              class="size-4 text-gray-400 group-hover:text-gray-600 transition-colors"
            />
          </div>
          <p class="text-sm text-gray-600">
            {{ tool.description }}
          </p>
        </RouterLink>
      </div>

      <div class="flex pt-4">
        <a
          href="https://github.com/scmmishra/tools.shivam.dev"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"
        >
          <IconGithubLogo class="size-4" />
          View on GitHub
        </a>
      </div>
    </div>
  </div>
</template>
