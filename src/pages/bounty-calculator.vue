<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Tools } from "../tools";
import ToolLayout from "../components/ToolLayout.vue";
import TextInput from "../components/form/TextInput.vue";
import {
  parseCvss,
  computeBaseScore,
  severityTier,
  REQUIRED_METRICS,
  METRIC_FULL_NAME,
  METRIC_VALUE_LABEL,
  TIER_LABEL,
  type ParsedCvss,
  type Tier,
} from "../utils/cvss";

const route = useRoute();
const router = useRouter();

const DEFAULT_VECTOR = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H";
const initialVector =
  typeof route.query.vector === "string" && route.query.vector
    ? route.query.vector
    : DEFAULT_VECTOR;

const cvssVector = ref(initialVector);
const showHowItWorks = ref(false);

watch(cvssVector, (v) => {
  const next = { ...route.query };
  if (v) {
    next.vector = v;
  } else {
    delete next.vector;
  }
  router.replace({ query: next });
});

watch(
  () => route.query.vector,
  (q) => {
    if (typeof q === "string" && q !== cvssVector.value) {
      cvssVector.value = q;
    }
  }
);

const tierRanges = {
  low: { min: 25, max: 50 },
  medium: { min: 50, max: 75 },
  high: { min: 75, max: 100 },
  critical: { min: 200, max: 300 },
};

const TIER_BOUNDS: Record<Exclude<Tier, "none">, [number, number]> = {
  low: [0.1, 3.9],
  medium: [4.0, 6.9],
  high: [7.0, 8.9],
  critical: [9.0, 10.0],
};

interface Kicker {
  label: string;
  weight: number;
  applies: boolean;
}

function getKickers(p: ParsedCvss): Kicker[] {
  return [
    { label: "AV:N — network reachable", weight: 0.05, applies: p.AV === "N" },
    { label: "AV:L — local access only", weight: -0.03, applies: p.AV === "L" },
    { label: "AV:P — physical access required", weight: -0.08, applies: p.AV === "P" },
    { label: "AC:H — hard to exploit", weight: -0.05, applies: p.AC === "H" },
    { label: "PR:N — no auth required", weight: 0.05, applies: p.PR === "N" },
    { label: "PR:H — admin required", weight: -0.04, applies: p.PR === "H" },
    { label: "UI:N — no user interaction", weight: 0.03, applies: p.UI === "N" },
    { label: "UI:R — user interaction required", weight: -0.05, applies: p.UI === "R" },
    { label: "S:C — scope changed", weight: 0.05, applies: p.S === "C" },
    {
      label: "Full CIA:H — total compromise",
      weight: 0.05,
      applies: p.C === "H" && p.I === "H" && p.A === "H",
    },
  ];
}

const ABSOLUTE_MAX_BOUNTY = 300;
const SUB_TEN_MAX_BOUNTY = 295;

function roundUpToFive(n: number): number {
  return Math.ceil(n / 5) * 5;
}

const parseResult = computed(() => parseCvss(cvssVector.value));

const calculation = computed(() => {
  const pr = parseResult.value;
  if (!pr.ok) return null;

  const score = computeBaseScore(pr.parsed);
  const tier = severityTier(score);

  if (tier === "none") {
    return {
      parsed: pr.parsed,
      score,
      tier,
      tierBand: null,
      baseBounty: 0,
      kickers: [] as Kicker[],
      totalKickerPct: 0,
      totalKickerDelta: 0,
      bountyRaw: 0,
      bounty: 0,
    };
  }

  const tierRange = tierRanges[tier];
  const [tMin, tMax] = TIER_BOUNDS[tier];
  const t = (score - tMin) / (tMax - tMin);
  const baseBounty = tierRange.min + t * (tierRange.max - tierRange.min);

  const kickers = getKickers(pr.parsed);
  const totalKickerPct = kickers
    .filter((k) => k.applies)
    .reduce((s, k) => s + k.weight, 0);
  const totalKickerDelta = baseBounty * totalKickerPct;
  const bountyRaw = Math.max(0, baseBounty + totalKickerDelta);
  const cap = score === 10 ? ABSOLUTE_MAX_BOUNTY : SUB_TEN_MAX_BOUNTY;
  const bountyRounded = roundUpToFive(bountyRaw);
  const bounty = Math.min(bountyRounded, cap);
  const capped = bountyRounded > cap;

  return {
    parsed: pr.parsed,
    score,
    tier,
    tierBand: tierRange,
    baseBounty,
    kickers,
    totalKickerPct,
    totalKickerDelta,
    bountyRaw,
    bounty,
    cap,
    capped,
  };
});

const tierColor: Record<Tier, string> = {
  none: "text-gray-500",
  low: "text-blue-600",
  medium: "text-yellow-600",
  high: "text-orange-600",
  critical: "text-red-600",
};

const metricRows = computed(() => {
  const p = calculation.value?.parsed;
  if (!p) return [];
  return REQUIRED_METRICS.map((m) => ({
    key: m,
    name: METRIC_FULL_NAME[m],
    value: p[m],
    valueLabel: METRIC_VALUE_LABEL[m][p[m]] ?? p[m],
  }));
});

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatUsdPrecise(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${(n * 100).toFixed(0)}%`;
}

const examples = [
  { label: "Critical RCE", vec: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H" },
  { label: "Stored XSS", vec: "CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:L/I:L/A:N" },
  { label: "Auth'd info disclosure", vec: "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N" },
  { label: "Local DoS", vec: "CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:N/I:N/A:H" },
];

function loadExample(vec: string) {
  cvssVector.value = vec;
}
</script>

<template>
  <ToolLayout :name="Tools.BountyCalculator">
    <div class="space-y-6">
      <TextInput
        id="cvss-vector"
        label="CVSS Vector String"
        placeholder="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
        v-model="cvssVector"
      />

      <div class="flex flex-wrap gap-2 -mt-3">
        <span class="text-xs text-gray-500 self-center">Examples:</span>
        <button
          v-for="ex in examples"
          :key="ex.label"
          @click="loadExample(ex.vec)"
          class="text-xs px-2 py-1 outline outline-gray-200 hover:outline-gray-400 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        >
          {{ ex.label }}
        </button>
      </div>

      <div
        v-if="!parseResult.ok"
        class="outline outline-red-200 bg-red-50 p-3 text-sm text-red-700"
      >
        {{ parseResult.error }}
      </div>

      <template v-if="parseResult.ok && calculation">
        <!-- Headline result -->
        <div class="outline outline-gray-200 p-4 grid grid-cols-2 gap-4">
          <div>
            <div class="text-xs text-gray-500 uppercase tracking-wider">
              Suggested Bounty
            </div>
            <div class="text-3xl font-mono font-medium mt-1">
              {{ formatUsd(calculation.bounty) }}
            </div>
            <div class="text-xs text-gray-500 mt-1">
              <span v-if="calculation.capped" class="text-amber-600">
                capped at {{ formatUsd(calculation.cap!) }} (raw
                {{ formatUsdPrecise(calculation.bountyRaw) }})
              </span>
              <span v-else>
                rounded up from {{ formatUsdPrecise(calculation.bountyRaw) }}
              </span>
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-500 uppercase tracking-wider">
              CVSS Score
            </div>
            <div class="text-3xl font-mono font-medium mt-1">
              {{ calculation.score.toFixed(1) }}
            </div>
            <div class="text-xs mt-1" :class="tierColor[calculation.tier]">
              {{ TIER_LABEL[calculation.tier] }}
              <span class="text-gray-500"
                >· CVSS v{{ calculation.parsed.version }}</span
              >
            </div>
          </div>
        </div>

        <!-- Parsed metrics -->
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-gray-700">Parsed Metrics</h3>
          <div class="outline outline-gray-200 p-4 space-y-1.5">
            <div
              v-for="row in metricRows"
              :key="row.key"
              class="grid grid-cols-[2fr_1fr_2fr] gap-x-3 text-sm items-center"
            >
              <span class="text-gray-600">{{ row.name }}</span>
              <span class="font-mono text-gray-500">{{ row.key }}:{{ row.value }}</span>
              <span class="text-right text-gray-700">{{ row.valueLabel }}</span>
            </div>
          </div>
        </div>

        <!-- Bounty breakdown -->
        <div v-if="calculation.tier !== 'none'" class="space-y-2">
          <h3 class="text-sm font-medium text-gray-700">Bounty Breakdown</h3>
          <div class="outline outline-gray-200 p-4 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">
                Tier band
                <span class="text-xs text-gray-500"
                  >({{ TIER_LABEL[calculation.tier] }})</span
                >
              </span>
              <span class="font-mono text-gray-700">
                {{ formatUsd(calculation.tierBand!.min) }} –
                {{ formatUsd(calculation.tierBand!.max) }}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">
                Base bounty
                <span class="text-xs text-gray-500"
                  >(interpolated at score {{ calculation.score.toFixed(1) }})</span
                >
              </span>
              <span class="font-mono text-gray-700">
                {{ formatUsdPrecise(calculation.baseBounty) }}
              </span>
            </div>

            <div class="pt-2 border-t border-gray-200 space-y-1.5">
              <div
                v-for="k in calculation.kickers"
                :key="k.label"
                class="grid grid-cols-[3fr_1fr_1fr] gap-x-3 text-sm items-center"
                :class="k.applies ? '' : 'text-gray-400'"
              >
                <span>{{ k.label }}</span>
                <span
                  class="text-right font-mono"
                  :class="k.applies ? (k.weight > 0 ? 'text-green-600' : 'text-red-600') : ''"
                >
                  {{ k.applies ? formatPct(k.weight) : "—" }}
                </span>
                <span
                  class="text-right font-mono"
                  :class="k.applies ? (k.weight > 0 ? 'text-green-600' : 'text-red-600') : ''"
                >
                  {{
                    k.applies
                      ? (k.weight > 0 ? "+" : "") +
                        formatUsdPrecise(calculation.baseBounty * k.weight).replace("-", "−")
                      : "—"
                  }}
                </span>
              </div>
            </div>

            <div
              class="flex justify-between text-sm pt-2 border-t border-gray-200"
            >
              <span class="text-gray-600">
                Net adjustment
                <span class="text-xs text-gray-500"
                  >({{ formatPct(calculation.totalKickerPct) }})</span
                >
              </span>
              <span
                class="font-mono"
                :class="
                  calculation.totalKickerDelta >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                "
              >
                {{ calculation.totalKickerDelta >= 0 ? "+" : "" }}{{
                  formatUsdPrecise(calculation.totalKickerDelta).replace("-", "−")
                }}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Subtotal</span>
              <span class="font-mono text-gray-700">
                {{ formatUsdPrecise(calculation.bountyRaw) }}
              </span>
            </div>
            <div
              class="flex justify-between text-sm pt-2 border-t border-gray-200"
            >
              <span class="font-medium text-gray-700">
                Final
                <span class="text-xs text-gray-500">
                  ({{ calculation.capped ? `capped, $5 step` : "rounded up to nearest $5" }})
                </span>
              </span>
              <span class="font-mono font-medium">
                {{ formatUsd(calculation.bounty) }}
              </span>
            </div>
          </div>
        </div>

        <div
          v-else
          class="outline outline-gray-200 p-4 text-sm text-gray-600"
        >
          CVSS score is 0 — no bounty suggested.
        </div>

      </template>

      <!-- How this works -->
      <div class="space-y-2">
        <button
          @click="showHowItWorks = !showHowItWorks"
          class="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1.5 cursor-pointer"
        >
          <span>{{ showHowItWorks ? "▾" : "▸" }}</span>
          How this works
        </button>
        <div
          v-if="showHowItWorks"
          class="outline outline-gray-200 p-4 space-y-4 text-sm text-gray-700"
        >
          <div>
            <p class="font-medium mb-1">1. Parse CVSS, compute base score</p>
            <p class="text-gray-600">
              The CVSS v3.0/3.1 vector is parsed and the base score is computed
              using the standard FIRST.org formula. This score determines the
              severity tier.
            </p>
          </div>

          <div>
            <p class="font-medium mb-1">2. Map score to tier and bounty range</p>
            <ul class="text-gray-600 mt-1 ml-4 list-disc space-y-0.5">
              <li>Low (0.1–3.9) → $25–50</li>
              <li>Medium (4.0–6.9) → $50–75</li>
              <li>High (7.0–8.9) → $75–100</li>
              <li>Critical (9.0–10.0) → $200–300</li>
            </ul>
          </div>

          <div>
            <p class="font-medium mb-1">3. Interpolate within tier</p>
            <p class="text-gray-600">
              The score's position within its tier sets the base bounty
              linearly. A 6.5 (mid-Medium) lands at ~$63; an 8.5 (mid-High) at
              ~$87.
            </p>
          </div>

          <div>
            <p class="font-medium mb-1">4. Apply component kickers</p>
            <p class="text-gray-600 mb-2">
              Each kicker adds or subtracts a percentage of the base bounty.
              CVSS already captures severity; kickers refine for exploitability
              factors that bounty programs weigh more heavily — UI:R requires
              phishing, AC:H means brittle exploits, AV:P is rarely realistic.
            </p>
            <div
              class="font-mono text-xs grid grid-cols-[1fr_auto] gap-x-4 gap-y-1"
            >
              <span class="text-gray-600">AV:N — network reachable</span>
              <span class="text-green-600 text-right">+5%</span>
              <span class="text-gray-600">AV:L — local access only</span>
              <span class="text-red-600 text-right">−3%</span>
              <span class="text-gray-600">AV:P — physical access</span>
              <span class="text-red-600 text-right">−8%</span>
              <span class="text-gray-600">AC:H — hard to exploit</span>
              <span class="text-red-600 text-right">−5%</span>
              <span class="text-gray-600">PR:N — no auth required</span>
              <span class="text-green-600 text-right">+5%</span>
              <span class="text-gray-600">PR:H — admin required</span>
              <span class="text-red-600 text-right">−4%</span>
              <span class="text-gray-600">UI:N — no user interaction</span>
              <span class="text-green-600 text-right">+3%</span>
              <span class="text-gray-600">UI:R — user interaction required</span>
              <span class="text-red-600 text-right">−5%</span>
              <span class="text-gray-600">S:C — scope changed</span>
              <span class="text-green-600 text-right">+5%</span>
              <span class="text-gray-600">Full CIA:H — total compromise</span>
              <span class="text-green-600 text-right">+5%</span>
            </div>
          </div>

          <div>
            <p class="font-medium mb-1">5. Round and cap</p>
            <p class="text-gray-600">
              The result is rounded up to the nearest $5. The hard ceiling is
              $300 — only a perfect 10.0 reaches it. Sub-10 scores cap at $295,
              so even a 9.9 with every positive kicker stops just short of the
              top.
            </p>
          </div>

          <p class="text-xs text-gray-500 pt-3 border-t border-gray-200">
            This is a heuristic, not policy. Use it as a starting point —
            adjust for real-world exploitability, blast radius, and report
            quality.
          </p>
        </div>
      </div>
    </div>
  </ToolLayout>
</template>
