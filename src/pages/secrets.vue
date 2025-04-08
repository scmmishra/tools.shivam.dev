<script setup lang="ts">
import { ref, watch } from "vue";
import Shifty from "@deepsource/shifty";
import ToolLayout from "../components/ToolLayout.vue";
import NumberInput from "../components/form/NumberInput.vue";

const length = ref(16);
const harden = ref(true);
const shifty = ref(new Shifty(harden.value, length.value));
const secret = ref("");

// Watch for changes in harden to update shifty instance
watch([harden, length], ([newHarden, newLength]) => {
  shifty.value = new Shifty(newHarden, newLength);
  generateSecret();
});

const generateSecret = () => {
  // Ensure length is within bounds
  if (length.value < 8) length.value = 8;
  if (length.value > 128) length.value = 128;
  secret.value = shifty.value.generate(length.value);
};

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(secret.value);
  } catch (err) {
    console.error("Failed to copy text: ", err);
  }
};

// Generate initial secret
generateSecret();
</script>

<template>
  <ToolLayout
    title="Secret Generator"
    description="Generate cryptographically secure secrets and passwords for your applications."
    :persist-keys="['secrets-length', 'secrets-harden']"
  >
    <div class="space-y-6">
      <div class="flex gap-6">
        <div class="flex-1">
          <NumberInput
            id="length"
            label="Length"
            v-model="length"
            persist="secrets-length"
            @update:modelValue="generateSecret"
            :min="8"
            :max="128"
            :step="1"
          />
        </div>
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Options</label
          >
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              v-model="harden"
              @change="generateSecret"
              class="rounded text-gray-600 focus:ring-0"
            />
            <span class="text-sm text-gray-600"
              >Include special characters</span
            >
          </label>
        </div>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-gray-700">Generated Secret:</h3>
          <button
            @click="generateSecret"
            class="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="size-3"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path
                d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"
              />
              <path
                d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"
              />
            </svg>
            Generate new
          </button>
        </div>
        <div class="relative">
          <p
            class="font-mono px-3 py-2 bg-gray-50 outline outline-gray-200 break-all"
          >
            {{ secret }}
          </p>
          <button
            @click="copyToClipboard"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="size-3"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path
                d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"
              />
              <path
                d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"
              />
            </svg>
            Copy
          </button>
        </div>
      </div>
    </div>
  </ToolLayout>
</template>
