<script setup lang="ts">
import { RouterLink } from "vue-router";
import IconArrowRight from "~icons/ph/arrow-right";
import IconGithubLogo from "~icons/ph/github-logo";
</script>

<template>
  <div class="max-w-3xl px-4">
    <div class="space-y-6">
      <div class="space-y-2">
        <h1 class="text-2xl font-bold text-gray-900">Developer Tools</h1>
        <p class="text-base text-gray-600">
          A collection of useful developer tools that run entirely in your
          browser. Your data never leaves your device.
        </p>
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <RouterLink
          to="/secrets"
          class="group block space-y-2 p-4 bg-white rounded-lg outline outline-gray-100 hover:outline-gray-200"
        >
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-gray-900">Secret Generator</h2>
            <IconArrowRight
              class="size-4 text-gray-400 group-hover:text-gray-600 transition-colors"
            />
          </div>
          <p class="text-sm text-gray-600">
            Generate cryptographically secure secrets and passwords with
            configurable length and special characters.
          </p>
        </RouterLink>

        <RouterLink
          to="/hmac"
          class="group block space-y-2 p-4 bg-white rounded-lg outline outline-gray-100 hover:outline-gray-200"
        >
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-gray-900">HMAC Generator</h2>
            <IconArrowRight
              class="size-4 text-gray-400 group-hover:text-gray-600 transition-colors"
            />
          </div>
          <p class="text-sm text-gray-600">
            Generate Hash-based Message Authentication Codes (HMAC) to verify
            message integrity and authenticity.
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
