<script setup lang="ts">
import { ref, watch } from "vue";
import Shifty from "@deepsource/shifty";
import ToolLayout from "../components/ToolLayout.vue";
import NumberInput from "../components/form/NumberInput.vue";
import IconArrowClockwise from "~icons/ph/arrow-clockwise";
import IconCopy from "~icons/ph/copy";

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
            class="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1.5 cursor-pointer"
          >
            <IconArrowClockwise class="size-3" />
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
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            <IconCopy class="size-4" />
          </button>
        </div>
      </div>
    </div>
  </ToolLayout>
</template>
