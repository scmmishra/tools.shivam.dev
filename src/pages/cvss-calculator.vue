<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Tools } from "../tools";
import ToolLayout from "../components/ToolLayout.vue";
import {
  buildVector,
  computeBaseScore,
  parseCvss,
  severityTier,
  REQUIRED_METRICS,
  METRIC_FULL_NAME,
  METRIC_VALUE_LABEL,
  METRIC_OPTIONS,
  METRIC_DESCRIPTION,
  METRIC_VALUE_DESCRIPTION,
  TIER_LABEL,
  type Metric,
  type ParsedCvss,
  type Tier,
} from "../utils/cvss";

const route = useRoute();
const router = useRouter();

const DEFAULT_PARSED: ParsedCvss = {
  version: "3.1",
  AV: "N",
  AC: "L",
  PR: "N",
  UI: "N",
  S: "U",
  C: "H",
  I: "H",
  A: "H",
};

function fromQuery(): ParsedCvss {
  const v = route.query.vector;
  if (typeof v === "string" && v) {
    const r = parseCvss(v);
    if (r.ok) return r.parsed;
  }
  return { ...DEFAULT_PARSED };
}

const metrics = ref<ParsedCvss>(fromQuery());

const vector = computed(() => buildVector(metrics.value));
const score = computed(() => computeBaseScore(metrics.value));
const tier = computed<Tier>(() => severityTier(score.value));

watch(
  vector,
  (v) => {
    const next = { ...route.query };
    next.vector = v;
    router.replace({ query: next });
  },
  { immediate: false }
);

watch(
  () => route.query.vector,
  (q) => {
    if (typeof q !== "string" || !q) return;
    if (q === vector.value) return;
    const r = parseCvss(q);
    if (r.ok) metrics.value = r.parsed;
  }
);

function selectMetric(m: Metric, value: string) {
  metrics.value = { ...metrics.value, [m]: value };
}

const tierColor: Record<Tier, string> = {
  none: "text-gray-500",
  low: "text-blue-600",
  medium: "text-yellow-600",
  high: "text-orange-600",
  critical: "text-red-600",
};

const bountyHref = computed(
  () => `/bounty-calculator?vector=${encodeURIComponent(vector.value)}`
);

const copied = ref(false);
async function copyVector() {
  await navigator.clipboard.writeText(vector.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1200);
}
</script>

<template>
  <ToolLayout :name="Tools.CvssCalculator">
    <div class="space-y-6">
      <!-- Headline result -->
      <div class="outline outline-gray-200 p-4 grid grid-cols-2 gap-4">
        <div>
          <div class="text-xs text-gray-500 uppercase tracking-wider">
            Base Score
          </div>
          <div class="text-3xl font-mono font-medium mt-1">
            {{ score.toFixed(1) }}
          </div>
          <div class="text-xs mt-1" :class="tierColor[tier]">
            {{ TIER_LABEL[tier] }}
            <span class="text-gray-500">· CVSS v{{ metrics.version }}</span>
          </div>
        </div>
        <div class="flex flex-col items-end justify-between gap-2">
          <a
            :href="bountyHref"
            class="text-sm px-3 py-2 outline outline-gray-300 hover:outline-gray-500 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            Check bounty →
          </a>
        </div>
      </div>

      <!-- Vector string -->
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-gray-700">Vector String</h3>
        <div
          class="outline outline-gray-200 p-3 flex items-center gap-2 justify-between"
        >
          <code class="font-mono text-sm text-gray-700 break-all">{{ vector }}</code>
          <button
            @click="copyVector"
            class="text-xs px-2 py-1 outline outline-gray-200 hover:outline-gray-400 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer shrink-0"
          >
            {{ copied ? "Copied" : "Copy" }}
          </button>
        </div>
      </div>

      <!-- Metric pickers -->
      <div class="space-y-4">
        <div v-for="m in REQUIRED_METRICS" :key="m" class="space-y-2">
          <div class="flex items-center gap-1.5">
            <span class="text-sm text-gray-700">
              {{ METRIC_FULL_NAME[m] }}
              <span class="text-xs text-gray-400 font-mono ml-1">{{ m }}</span>
            </span>
            <button
              type="button"
              :popovertarget="`metric-${m}-help`"
              :style="`anchor-name: --metric-${m}`"
              class="metric-help-trigger size-4 inline-flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
              :aria-label="`About ${METRIC_FULL_NAME[m]}`"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                class="size-3.5"
              >
                <path
                  d="M8 1.5A6.5 6.5 0 1 0 14.5 8 6.508 6.508 0 0 0 8 1.5ZM8 13.5A5.5 5.5 0 1 1 13.5 8 5.506 5.506 0 0 1 8 13.5Z"
                />
                <path d="M8.75 7h-1.5v5h1.5zM8 4a1 1 0 1 0 1 1 1 1 0 0 0-1-1Z" />
              </svg>
            </button>
          </div>
          <div
            :id="`metric-${m}-help`"
            popover
            :style="`position-anchor: --metric-${m}`"
            class="metric-help-popover bg-white outline outline-gray-300 p-4 text-sm max-w-sm space-y-3 shadow-lg"
          >
            <div>
              <p class="font-medium text-gray-800">
                {{ METRIC_FULL_NAME[m] }}
                <span class="text-xs text-gray-400 font-mono ml-1">{{ m }}</span>
              </p>
              <p class="text-gray-600 text-xs mt-1">
                {{ METRIC_DESCRIPTION[m] }}
              </p>
            </div>
            <div class="space-y-2 pt-2 border-t border-gray-200">
              <div
                v-for="opt in METRIC_OPTIONS[m]"
                :key="opt"
                class="text-xs"
              >
                <div class="font-mono text-gray-700">
                  {{ opt }} — {{ METRIC_VALUE_LABEL[m][opt] }}
                </div>
                <div class="text-gray-600 mt-0.5">
                  {{ METRIC_VALUE_DESCRIPTION[m][opt] }}
                </div>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in METRIC_OPTIONS[m]"
              :key="opt"
              @click="selectMetric(m, opt)"
              :title="METRIC_VALUE_DESCRIPTION[m][opt]"
              :class="[
                'text-sm px-3 py-1.5 outline transition-colors cursor-pointer',
                metrics[m] === opt
                  ? 'outline-gray-700 bg-gray-100 text-gray-900'
                  : 'outline-gray-200 hover:outline-gray-400 text-gray-600 hover:text-gray-900',
              ]"
            >
              {{ METRIC_VALUE_LABEL[m][opt] }}
              <span class="text-xs text-gray-400 font-mono ml-1">{{ opt }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </ToolLayout>
</template>

<style scoped>
@supports (position-anchor: --foo) {
  .metric-help-popover {
    inset: auto;
    margin: 0;
    position-area: bottom span-right;
    margin-top: 0.5rem;
  }
}
</style>
