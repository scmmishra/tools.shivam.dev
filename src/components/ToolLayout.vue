<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="space-y-6 max-w-3xl">
    <div>
      <h1 class="text-xl font-medium tracking-wider truncate">
        {{ title }}
      </h1>
      <div class="text-gray-600 max-w-xl mt-2">
        <slot name="description">
          <p v-if="description">{{ description }}</p>
        </slot>
      </div>
    </div>
    <slot></slot>
  </div>
</template>
