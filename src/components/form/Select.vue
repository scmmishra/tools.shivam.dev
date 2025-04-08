<script setup lang="ts">
import WithLabel from './WithLabel.vue'
import { usePersist } from '../../composables/usePersist'

const model = defineModel<string>()

const props = defineProps<{
  label: string
  id: string
  options: { value: string; label?: string }[]
  persist?: string
}>()

// Setup persistence if key is provided
usePersist(props.persist, model)
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
