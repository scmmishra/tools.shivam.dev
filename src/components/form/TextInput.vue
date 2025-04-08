<script setup lang="ts">
import WithLabel from './WithLabel.vue'

const model = defineModel()

defineProps<{
  label: string
  id: string
  placeholder?: string
}>()
</script>

<template>
  <WithLabel :label="label" :for="id">
    <input
      type="text"
      :id="id"
      :value="model"
      @input="e => model = (e.target as HTMLInputElement).value"
      class="w-full px-3 py-2 outline outline-gray-200 focus:outline-gray-400 transition-colors overflow-hidden"
      :placeholder="placeholder"
    />
  </WithLabel>
</template>
