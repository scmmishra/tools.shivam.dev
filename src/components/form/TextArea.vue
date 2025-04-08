<script setup lang="ts">
import WithLabel from "./WithLabel.vue";
import { usePersist } from "../../composables/usePersist";

const model = defineModel<string>();

const props = defineProps<{
  label: string;
  id: string;
  placeholder?: string;
  rows?: number;
  persist?: string;
}>();

// Setup persistence if key is provided
usePersist(props.persist, model);
</script>

<template>
  <WithLabel :label="label" :html-for="id">
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
