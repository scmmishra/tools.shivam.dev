<script setup lang="ts">
import { defineProps, ref } from "vue";
import { useClipboard } from "@vueuse/core";
import IconCopy from "~icons/ph/copy";
import IconCheck from "~icons/ph/check";

const props = defineProps<{
  title: string;
  value?: string;
  placeholder?: string;
  disableCopy?: boolean;
  bg?: string;
  is?: "p" | "pre";
  error?: string;
}>();

const { copy } = useClipboard();
const isJustCopied = ref(false);
let timeout: ReturnType<typeof setTimeout>;

const handleCopy = async () => {
  if (!props.value) return;

  await copy(props.value);
  isJustCopied.value = true;

  // Clear any existing timeout
  if (timeout) clearTimeout(timeout);

  // Set new timeout
  timeout = setTimeout(() => {
    isJustCopied.value = false;
  }, 500);
};
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <h3 class="block text-xs uppercase tracking-wider text-gray-500">
        {{ title }}
      </h3>
      <slot name="action" />
    </div>
    <div class="relative">
      <component
        :is="is || 'p'"
        class="font-mono px-3 py-2 outline outline-gray-200 break-all overflow-auto"
        :class="[value ? '' : 'text-gray-400', bg || 'bg-gray-50']"
      >
        <slot>
          {{ value || placeholder }}
        </slot>
      </component>
      <button
        v-if="value && !disableCopy"
        @click="handleCopy"
        class="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
      >
        <Transition
          mode="out-in"
          enter-active-class="transition ease-out duration-100"
          enter-from-class="transform -translate-y-2 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="transform translate-y-0 opacity-100"
          leave-to-class="transform translate-y-2 opacity-0"
        >
          <IconCheck v-if="isJustCopied" class="size-4 text-green-500" />
          <IconCopy v-else class="size-4" />
        </Transition>
      </button>
    </div>
    <p
      v-if="error"
      class="font-mono px-3 py-2 bg-red-50 outline outline-red-200 text-red-600 break-all"
    >
      Error: {{ error }}
    </p>
  </div>
</template>
