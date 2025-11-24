<script setup lang="ts">
import { computed, ref } from "vue";
import { parse, formatHex } from "culori";

import { Tools } from "../tools";
import ToolLayout from "../components/ToolLayout.vue";
import TextInput from "../components/form/TextInput.vue";

const leftColor = ref("");
const rightColor = ref("");

const comparisons = computed(() => [
  { label: "Color A", value: leftColor.value, placeholder: "e.g. #1d4ed8" },
  { label: "Color B", value: rightColor.value, placeholder: "e.g. rgb(99, 102, 241)" },
].map((entry) => {
  const parsed = entry.value ? parse(entry.value) : null;

  return {
    ...entry,
    isValid: Boolean(parsed),
    hex: parsed ? formatHex(parsed) : "",
  };
}));
</script>

<template>
  <ToolLayout
    :name="Tools.ColorCompare"
    :persist-keys="['color-compare-left', 'color-compare-right']"
  >
    <template #description>
      <p>
        Drop in any two valid CSS colors to view them side by side with normalized HEX values.
      </p>
    </template>

    <div class="space-y-6">
      <div class="grid md:grid-cols-2 gap-4">
        <TextInput
          v-model="leftColor"
          id="color-compare-left"
          label="Color A"
          persist="color-compare-left"
          :placeholder="comparisons[0].placeholder"
        />
        <TextInput
          v-model="rightColor"
          id="color-compare-right"
          label="Color B"
          persist="color-compare-right"
          :placeholder="comparisons[1].placeholder"
        />
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <div
          v-for="color in comparisons"
          :key="color.label"
          class="space-y-3"
        >
          <div class="flex items-center justify-between">
            <p class="font-medium text-gray-800">{{ color.label }}</p>
            <span
              v-if="color.value"
              class="text-xs font-mono text-gray-600"
            >
              {{ color.isValid ? color.hex : "Invalid color" }}
            </span>
          </div>

          <div class="relative h-28 rounded-lg overflow-hidden outline outline-gray-200">
            <div
              class="absolute inset-0 transition-colors duration-200"
              :style="{ backgroundColor: color.isValid ? color.hex : '#f3f4f6' }"
            ></div>

            <div
              v-if="!color.value"
              class="absolute inset-0 grid place-items-center text-sm text-gray-400"
            >
              Enter {{ color.label.toLowerCase() }}
            </div>

            <div
              v-else
              class="absolute inset-x-0 bottom-0 text-center text-xs bg-white/80 backdrop-blur py-1"
            >
              <span class="font-mono">
                {{ color.isValid ? color.hex : "Invalid color" }}
              </span>
            </div>
          </div>

          <p v-if="color.value && !color.isValid" class="text-sm text-red-500">
            Enter a valid CSS color for {{ color.label.toLowerCase() }}.
          </p>
        </div>
      </div>
    </div>
  </ToolLayout>
</template>
