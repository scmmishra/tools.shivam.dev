<script setup lang="ts">
import { computed, ref } from "vue";
import ToolLayout from "../components/ToolLayout.vue";
import TextInput from "../components/form/TextInput.vue";
import Result from "../components/Result.vue";
import { parse, formatHex, formatRgb, formatHsl } from "culori";

const color = ref("");

const isValid = computed(() => {
  return color.value && parse(color.value) !== null;
});

const convertedColors = computed(() => {
  if (!isValid.value) {
    return {
      hex: "",
      rgb: "",
      rgba: "",
      hsl: "",
      hsla: "",
    };
  }

  const parsed = parse(color.value);

  return {
    hex: formatHex(parsed),
    rgb: formatRgb(parsed),
    hsl: formatHsl(parsed),
  };
});
</script>

<template>
  <ToolLayout
    title="Color Converter"
    description="Convert colors between different formats."
    :persist-keys="['color-input']"
  >
    <div class="space-y-6">
      <!-- Input Section -->
      <div>
        <TextInput
          v-model="color"
          id="color-input"
          label="Enter Color"
          persist="color-input"
          placeholder="e.g. #ff0000, rgb(255, 0, 0), hsl(0, 100%, 50%), skyblue"
        />
      </div>

      <div v-if="isValid" class="flex items-center space-x-4">
        <div
          class="w-12 h-12 rounded-lg shadow-inner outline outline-gray-200"
          :style="{ backgroundColor: color }"
        ></div>
        <p class="text-sm text-gray-600">Color Preview</p>
      </div>

      <div class="space-y-4">
        <Result
          title="HEX"
          placeholder="Color in HEX"
          :value="isValid ? convertedColors.hex || '' : ''"
        />
        <Result
          title="RGB / RGBA"
          placeholder="Color in RGB / RGBA"
          :value="isValid ? convertedColors.rgb || '' : ''"
        />
        <Result
          title="HSL / HSLA"
          placeholder="Color in HSL / HSLA"
          :value="isValid ? convertedColors.hsl || '' : ''"
        />
      </div>

      <!-- Error Message -->
      <p v-if="!isValid && color" class="text-red-500 text-sm">
        Invalid color format. Please enter a valid color.
      </p>
    </div>
  </ToolLayout>
</template>
