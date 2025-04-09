<script setup lang="ts">
import { ref, computed } from "vue";

import { Tools } from "../tools";
import { calculateFleschReadingEase } from "../utils.js/readability";
import ToolLayout from "../components/ToolLayout.vue";
import TextArea from "../components/form/TextArea.vue";
import Result from "../components/Result.vue";

const text = ref("");

const stats = computed(() => {
  const content = text.value;
  if (!content) {
    return {
      characters: 0,
      charactersNoSpaces: 0,
      words: 0,
      sentences: 0,
      paragraphs: 0,
    };
  }

  // Character count (with and without spaces)
  const characters = content.length;
  const charactersNoSpaces = content.replace(/\s/g, "").length;

  // Word count
  const words = content
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  // Sentence count (splits on . ! ? and handles common abbreviations)
  const sentenceMatches = content.match(/[^.!?]+[.!?]+/g);
  const sentences = sentenceMatches ? sentenceMatches.length : 0;

  // Paragraph count (splits on double newlines)
  const paragraphs =
    content.split(/\n\s*\n/).filter((para) => para.trim().length > 0).length ||
    0;

  return {
    characters,
    charactersNoSpaces,
    words,
    sentences,
    paragraphs,
  };
});

const readability = computed(() => calculateFleschReadingEase(text.value));
</script>

<template>
  <ToolLayout :name="Tools.WordCounter" :persist-keys="['word-counter-text']">
    <div class="space-y-6">
      <TextArea
        id="text"
        label="Text"
        placeholder="Enter or paste your text here"
        v-model="text"
        persist="word-counter-text"
        :rows="12"
      />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Result title="Characters" :value="stats.characters.toString()" />
        <Result
          title="Characters (no spaces)"
          :value="stats.charactersNoSpaces.toString()"
        />
        <Result title="Words" :value="stats.words.toString()" />
        <Result title="Sentences" :value="stats.sentences.toString()" />
        <Result title="Paragraphs" :value="stats.paragraphs.toString()" />
        <Result
          disable-copy
          title="Readability"
          :value="`${readability.score} / 10`"
        />
      </div>
    </div>
  </ToolLayout>
</template>
