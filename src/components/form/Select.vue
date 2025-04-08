<script setup lang="ts">
import WithLabel from './WithLabel.vue'

const model = defineModel()

defineProps<{
  label: string
  id: string
  options: { value: string; label?: string }[]
}>()
</script>

<template>
  <WithLabel :label="label" :for="id">
    <select
      :id="id"
      :value="model"
      @change="e => model = (e.target as HTMLSelectElement).value"
      class="w-full px-3 py-2 outline outline-gray-200 focus:outline-gray-400 transition-colors overflow-hidden"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label ?? option.value }}
      </option>
    </select>
  </WithLabel>
</template>
