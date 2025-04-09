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
    output.value = btoa(value);
  } catch (e) {
    error.value = "Invalid input string";
    output.value = "";
  }
});

const updateInput = (newValue: string | undefined) => {
  input.value = newValue ?? "";
};
</script>

<template>
  <ToolLayout :name="Tools.Base64Encode" :persist-keys="['base64-encode-input']">
    <div class="space-y-6">
      <TextArea
        id="base64-encode-input"
        label="Input String"
        placeholder="Enter your string to encode"
        v-model="input"
        @update="updateInput"
        persist="base64-encode-input"
      />

      <Result
        title="Base64 Output"
        placeholder="Base64 encoded output will appear here"
        :value="output"
        :error="error"
      />
    </div>
  </ToolLayout>
</template>
