<template>
  <aside class="sticky top-0 grid h-screen p-3 pr-0 basis-64">
    <div
      class="flex flex-col h-full bg-white outline outline-gray-200 shadow px-4 py-3"
    >
      <span class="text-xl font-medium uppercase tracking-wider">Tools</span>
      <span class="text-xs tracking-wide text-gray-600 mb-4">
        by <a class="underline" href="https://shivam.dev">shivam.dev</a>
      </span>

      <nav class="space-y-1 -mx-2">
        <RouterLink
          to="/hmac"
          class="block px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          active-class="text-gray-900 bg-gray-50 outline outline-gray-100"
        >
          HMAC Generator
        </RouterLink>
        <RouterLink
          to="/secrets"
          class="block px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          active-class="text-gray-900 bg-gray-50 outline outline-gray-100"
        >
          Secret Generator
        </RouterLink>
        <RouterLink
          to="/color"
          class="block px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          active-class="text-gray-900 bg-gray-50 outline outline-gray-100"
        >
          Color Converter
        </RouterLink>
      </nav>
    </div>
  </aside>
</template>
