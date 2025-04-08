<script setup lang="ts">
defineProps<{
  label: string;
  htmlFor: string;
}>();
</script>

<template>
  <div class="space-y-2">
    <label :for="htmlFor" class="block text-sm font-medium text-gray-700">
      {{ label }}
    </label>
    <slot></slot>
  </div>
</template>
