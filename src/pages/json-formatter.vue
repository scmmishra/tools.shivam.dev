<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { Tools } from "../tools";
import ToolLayout from "../components/ToolLayout.vue";
import TextArea from "../components/form/TextArea.vue";
import Result from "../components/Result.vue";
import { createHighlighter } from "shiki";

const input = ref("");
const error = ref("");
const highlighter = ref<any>(null);

onMounted(async () => {
  highlighter.value = await createHighlighter({
    themes: ["github-light"],
    langs: ["json"],
  });
});

const formattedJson = computed(() => {
  if (!input.value) return "";
  try {
    error.value = "";
    return JSON.stringify(JSON.parse(input.value), null, 2);
  } catch (e) {
    error.value = "Invalid JSON";
    return "";
  }
});

const highlighted = computed(() => {
  if (!formattedJson.value || !highlighter.value) return "";
  try {
    return highlighter.value.codeToHtml(formattedJson.value, {
      lang: "json",
      theme: "github-light",
    });
  } catch (e) {
    return "";
  }
});

const updateInput = (newValue: string | undefined) => {
  input.value = newValue ?? "";
};
</script>

<template>
  <ToolLayout
    :name="Tools.JsonFormatter"
    :persist-keys="['json-formatter-input']"
  >
    <div class="space-y-6">
      <TextArea
        id="json-formatter-input"
        label="JSON Input"
        placeholder="Paste your JSON here"
        v-model="input"
        @update="updateInput"
        persist="json-formatter-input"
      />

      <Result
        is="pre"
        title="Formatted JSON"
        placeholder="Formatted JSON will appear here"
        :value="formattedJson"
        :error="error"
        bg="bg-white"
      >
        <template #default>
          <div v-if="highlighted" v-html="highlighted" />
          <span v-else>{{
            formattedJson || "Formatted JSON will appear here"
          }}</span>
        </template>
      </Result>
    </div>
  </ToolLayout>
</template>
