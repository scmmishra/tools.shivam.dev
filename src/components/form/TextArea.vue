<script setup lang="ts">
import WithLabel from "./WithLabel.vue";

const model = defineModel<string>();

defineProps<{
  label: string;
  id: string;
  placeholder?: string;
  rows?: number;
}>();
</script>

<template>
  <WithLabel :label="label" :for="id">
    <textarea
      :id="id"
      :value="model"
      @input="e => model = (e.target as HTMLTextAreaElement).value"
      :rows="rows ?? 3"
      class="w-full px-3 py-2 outline outline-gray-200 focus:outline-gray-400 transition-colors overflow-auto"
      :placeholder="placeholder"
    ></textarea>
  </WithLabel>
</template>
