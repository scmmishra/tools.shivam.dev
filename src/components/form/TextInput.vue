<script setup lang="ts">
import WithLabel from "./WithLabel.vue";
import { usePersist } from "../../composables/usePersist";

const model = defineModel<string>();

const props = defineProps<{
  label: string;
  id: string;
  placeholder?: string;
  persist?: string;
}>();

usePersist(props.persist, model);
</script>

<template>
  <WithLabel :label="label" :html-for="id">
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
