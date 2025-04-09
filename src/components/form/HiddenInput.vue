<script setup lang="ts">
import { ref, defineProps, defineEmits } from "vue";
import IconLock from "~icons/ph/lock";
import IconLockOpen from "~icons/ph/lock-open";

defineProps<{
  modelValue: string;
  label: string;
  placeholder?: string;
  id?: string;
  persist?: string;
}>();

const emit = defineEmits(["update:modelValue", "update"]);
const isVisible = ref(false);

const updateValue = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  emit("update:modelValue", value);
  emit("update", value);
};
</script>

<template>
  <div class="space-y-2">
    <label
      :for="id"
      class="block text-xs uppercase tracking-wider text-gray-500"
    >
      {{ label }}:
    </label>
    <div class="relative">
      <input
        :id="id"
        :type="isVisible ? 'text' : 'password'"
        :value="modelValue"
        @input="updateValue"
        :placeholder="placeholder"
        autocomplete="off"
        class="w-full font-mono px-3 py-2 bg-gray-50 outline outline-gray-200"
        :data-persist="persist"
      />
      <button
        @click="isVisible = !isVisible"
        class="absolute flex items-center gap-1 right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
      >
        <component :is="isVisible ? IconLockOpen : IconLock" class="w-3 h-3" />
        <span class="uppercase text-xs">{{ isVisible ? "Hide" : "Show" }}</span>
      </button>
    </div>
  </div>
</template>
