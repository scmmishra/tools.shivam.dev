<script setup lang="ts">
import { ref, watch } from "vue";
import { Tools } from "../tools";
import ToolLayout from "../components/ToolLayout.vue";
import TextArea from "../components/form/TextArea.vue";
import Result from "../components/Result.vue";

const input = ref("");
const output = ref("");
const error = ref("");

watch(input, (value) => {
  try {
    error.value = "";
    if (!value) {
      output.value = "";
      return;
    }
    output.value = atob(value);
  } catch (e) {
    error.value = "Invalid Base64 string";
    output.value = "";
  }
});

const updateInput = (newValue: string | undefined) => {
  input.value = newValue ?? "";
};
</script>

<template>
  <ToolLayout :name="Tools.Base64" :persist-keys="['base64-input']">
    <div class="space-y-6">
      <TextArea
        id="base64-input"
        label="Base64 String"
        placeholder="Enter your Base64 string here"
        v-model="input"
        @update="updateInput"
        persist="base64-input"
      />

      <Result
        title="Decoded Output"
        placeholder="Decoded output will appear here"
        :value="output"
        :error="error"
      />
    </div>
  </ToolLayout>
</template>
