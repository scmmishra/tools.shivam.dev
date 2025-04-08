<script setup lang="ts">
import { ref, watch } from "vue";
import { Tools } from "../tools";
import Shifty from "@deepsource/shifty";
import ToolLayout from "../components/ToolLayout.vue";
import NumberInput from "../components/form/NumberInput.vue";
import IconArrowClockwise from "~icons/ph/arrow-clockwise";
import Result from "../components/Result.vue";

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

// Generate initial secret
generateSecret();
</script>

<template>
  <ToolLayout
    :name="Tools.Secrets"
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
          <label
            class="block block text-xs uppercase tracking-wider text-gray-500 mb-2"
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

      <Result title="Generated Secret" :value="secret">
        <template #action>
          <button
            @click="generateSecret"
            class="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1.5 cursor-pointer"
          >
            <IconArrowClockwise class="size-3" />
            Generate new
          </button>
        </template>
      </Result>
    </div>
  </ToolLayout>
</template>
