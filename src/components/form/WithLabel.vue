<script setup lang="ts">
defineProps<{
  label: string;
  htmlFor: string;
}>();
</script>

<template>
  <div class="space-y-2">
    <label
      :html-for="htmlFor"
      class="block text-xs uppercase tracking-wider text-gray-500"
    >
      {{ label }}
    </label>
    <slot></slot>
  </div>
</template>
