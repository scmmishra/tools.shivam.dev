<script setup lang="ts">
import { ref, computed } from "vue";
import { format } from "sql-formatter";
import { createHighlighter } from "shiki";

import { Tools } from "../tools";
import ToolLayout from "../components/ToolLayout.vue";
import TextArea from "../components/form/TextArea.vue";
import Select from "../components/form/Select.vue";
import Result from "../components/Result.vue";

const input = ref("");
const language = ref("sql");

let highlighter: any;

createHighlighter({
  themes: ["github-light"],
  langs: ["sql"],
}).then((h) => {
  highlighter = h;
});

const formattedSql = computed(() => {
  if (!input.value) return "";

  try {
    return format(input.value, {
      language: language.value as any,
      keywordCase: "upper",
      indentStyle: "standard",
    });
  } catch (err) {
    return "";
  }
});

const highlightedCode = computed(() => {
  if (!formattedSql.value || !highlighter) return "";

  try {
    return highlighter.codeToHtml(formattedSql.value, {
      lang: "sql",
      theme: "github-light",
    });
  } catch (err) {
    return "";
  }
});

const languageOptions = [
  { value: "sql", label: "SQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "mariadb", label: "MariaDB" },
  { value: "sqlite", label: "SQLite" },
].map((option) => ({
  value: option.value,
  label: option.label,
}));
</script>

<template>
  <ToolLayout
    :name="Tools.SqlFormatter"
    :persist-keys="['sql-input', 'sql-language']"
  >
    <div class="space-y-6">
      <TextArea
        id="input"
        label="SQL Query"
        placeholder="Enter your SQL query"
        v-model="input"
        persist="sql-input"
      />

      <Select
        id="language"
        label="SQL Dialect"
        v-model="language"
        :options="languageOptions"
        persist="sql-language"
      />

      <Result
        title="Formatted SQL"
        is="pre"
        bg="bg-white"
        placeholder="Formatted SQL will appear here"
      >
        <template v-if="highlightedCode" #default>
          <div v-html="highlightedCode" class="shiki-wrapper" />
        </template>
      </Result>
    </div>
  </ToolLayout>
</template>

<style>
.shiki-wrapper {
  font-family: "Geist Mono Variable", monospace;
}
.shiki-wrapper :deep(pre) {
  margin: 0;
  padding: 0;
  background: transparent !important;
}
</style>
