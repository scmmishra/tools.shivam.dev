<script setup lang="ts"></script>

<template>
  <div class="flex bg-gray-50">
    <aside class="sticky top-0 grid h-screen p-3 pr-0 basis-64">
      <div
        class="flex flex-col h-full bg-white outline outline-gray-200 shadow px-4 py-3"
      >
        <span class="text-xl font-medium uppercase tracking-wider">Tools</span>
        <span class="text-xs tracking-wide text-gray-600">
          by <a class="underline" href="https://shivam.dev"> shivam.dev </a>
        </span>
      </div>
    </aside>
    <main
      class="basis-0 flex-grow-[999] [min-inline-size_50%] min-h-screen p-3"
    >
      <div class="bg-white outline outline-gray-200 h-full shadow px-4 py-3">
        <RouterView />
      </div>
    </main>
  </div>
</template>
