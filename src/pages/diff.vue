<script setup lang="ts">
import { ref, computed } from "vue";
import * as jsdiff from "diff";

import { Tools } from "../tools";
import ToolLayout from "../components/ToolLayout.vue";
import TextArea from "../components/form/TextArea.vue";
import Select from "../components/form/Select.vue";
import Result from "../components/Result.vue";

const originalText = ref("");
const modifiedText = ref("");
const diffType = ref("chars");
const diffOptions = [
  { value: "chars", label: "Character by Character" },
  { value: "words", label: "Word by Word" },
  { value: "lines", label: "Line by Line" },
].map(({ value, label }) => ({
  value,
  label,
}));

const diffResult = computed(() => {
  if (!originalText.value && !modifiedText.value) {
    return "";
  }

  let diff;
  switch (diffType.value) {
    case "chars":
      diff = jsdiff.diffChars(originalText.value, modifiedText.value);
      break;
    case "words":
      diff = jsdiff.diffWords(originalText.value, modifiedText.value);
      break;
    case "lines":
      diff = jsdiff.diffLines(originalText.value, modifiedText.value);
      break;
    default:
      diff = jsdiff.diffChars(originalText.value, modifiedText.value);
  }

  return diff
    .map((part) => {
      if (part.added) {
        return `<span class="bg-green-100 text-green-800">${part.value}</span>`;
      }
      if (part.removed) {
        return `<span class="bg-red-100 text-red-800">${part.value}</span>`;
      }
      return part.value;
    })
    .join("");
});
</script>

<template>
  <ToolLayout
    :name="Tools.Diff"
    :persist-keys="['diff-original', 'diff-modified', 'diff-type']"
  >
    <div class="space-y-6">
      <TextArea
        id="original"
        label="Original Text"
        placeholder="Enter original text"
        v-model="originalText"
        persist="diff-original"
      />

      <TextArea
        id="modified"
        label="Modified Text"
        placeholder="Enter modified text"
        v-model="modifiedText"
        persist="diff-modified"
      />

      <Select
        id="diffType"
        label="Diff Type"
        :options="diffOptions"
        v-model="diffType"
        persist="diff-type"
      />

      <Result
        title="Diff Result"
        placeholder="Enter text in both fields to see the difference"
      >
        <div
          class="min-h-[100px] whitespace-pre-wrap"
          v-html="
            diffResult || 'Enter text in both fields to see the difference'
          "
        ></div>
      </Result>
    </div>
  </ToolLayout>
</template>
