<script setup lang="ts">
import WithLabel from "./WithLabel.vue";
import { usePersist } from "../../composables/usePersist";

const model = defineModel<number>();

const props = defineProps<{
  label: string;
  id: string;
  placeholder?: string;
  persist?: string;
  min?: number;
  max?: number;
  step?: number;
}>();

const handleInput = (e: Event) => {
  const value = (e.target as HTMLInputElement).value;
  // If empty, set to min or 0
  if (!value) {
    model.value = props.min ?? 0;
    return;
  }
  model.value = Number(value);
};

// Setup persistence if key is provided
usePersist(props.persist, model);
</script>

<template>
  <WithLabel :label="label" :html-for="id">
    <input
      type="number"
      :id="id"
      :value="model"
      @input="handleInput"
      class="w-full px-3 py-2 outline outline-gray-200 focus:outline-gray-400 transition-colors overflow-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      :placeholder="placeholder"
      :min="min"
      :max="max"
      :step="step"
    />
  </WithLabel>
</template>
