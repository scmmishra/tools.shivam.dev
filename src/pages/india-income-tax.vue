<script setup lang="ts">
import { ref, computed } from "vue";
import { Tools } from "../tools";
import ToolLayout from "../components/ToolLayout.vue";
import NumberInput from "../components/form/NumberInput.vue";

const annualSalary = ref(1000000);
const npsAnnual = ref(0);
const basicSalary = ref(0);
const dearnessAllowance = ref(0);

// If Basic isn't entered, assume it's 50% of annual salary (common default).
const basicAssumed = computed(() => (basicSalary.value || 0) <= 0);
const effectiveBasic = computed(() =>
  basicAssumed.value
    ? (annualSalary.value || 0) * 0.5
    : Math.max(0, basicSalary.value || 0),
);
const basicPlusDA = computed(
  () => effectiveBasic.value + Math.max(0, dearnessAllowance.value || 0),
);

const STANDARD_DEDUCTION = 75000;
const REBATE_LIMIT = 1200000;
const MAX_REBATE = 60000;
const CESS_RATE = 0.04;
const NPS_MAX_RATE = 0.14; // 80CCD(2): 14% of Basic + DA (new regime, FY 2025-26)

interface TaxSlab {
  min: number;
  max: number | null;
  rate: number;
  label: string;
}

const taxSlabs: TaxSlab[] = [
  { min: 0, max: 400000, rate: 0, label: "Up to ₹4 lakh" },
  { min: 400000, max: 800000, rate: 0.05, label: "₹4 lakh - ₹8 lakh" },
  { min: 800000, max: 1200000, rate: 0.1, label: "₹8 lakh - ₹12 lakh" },
  { min: 1200000, max: 1600000, rate: 0.15, label: "₹12 lakh - ₹16 lakh" },
  { min: 1600000, max: 2000000, rate: 0.2, label: "₹16 lakh - ₹20 lakh" },
  { min: 2000000, max: 2400000, rate: 0.25, label: "₹20 lakh - ₹24 lakh" },
  { min: 2400000, max: null, rate: 0.3, label: "Above ₹24 lakh" },
];

interface SlabBreakdown {
  label: string;
  taxableAmount: number;
  rate: number;
  tax: number;
}

// Core tax math for a given taxable income (New Regime, FY 2025-26).
function computeTaxFor(taxableIncome: number) {
  // Calculate tax for each slab
  const slabBreakdown: SlabBreakdown[] = [];
  let totalTax = 0;

  for (const slab of taxSlabs) {
    if (taxableIncome <= slab.min) break;

    const slabMax = slab.max || Infinity;
    const taxableInSlab = Math.min(taxableIncome, slabMax) - slab.min;

    if (taxableInSlab > 0) {
      const taxInSlab = taxableInSlab * slab.rate;
      totalTax += taxInSlab;

      slabBreakdown.push({
        label: slab.label,
        taxableAmount: taxableInSlab,
        rate: slab.rate,
        tax: taxInSlab,
      });
    }
  }

  // Apply rebate under Section 87A (with marginal relief above ₹12L)
  let rebate = 0;
  if (taxableIncome <= REBATE_LIMIT) {
    rebate = Math.min(totalTax, MAX_REBATE);
  } else {
    // Marginal relief: cap tax at the income exceeding the rebate limit
    const excessOverLimit = taxableIncome - REBATE_LIMIT;
    if (totalTax > excessOverLimit) {
      rebate = totalTax - excessOverLimit;
    }
  }
  const taxAfterRebate = Math.max(0, totalTax - rebate);

  // Calculate surcharge
  let surcharge = 0;
  let surchargeRate = 0;
  if (taxableIncome > 50000000) {
    // Above 5 crore
    surchargeRate = 0.25;
    surcharge = taxAfterRebate * surchargeRate;
  } else if (taxableIncome > 20000000) {
    // 2 crore to 5 crore
    surchargeRate = 0.25;
    surcharge = taxAfterRebate * surchargeRate;
  } else if (taxableIncome > 10000000) {
    // 1 crore to 2 crore
    surchargeRate = 0.15;
    surcharge = taxAfterRebate * surchargeRate;
  } else if (taxableIncome > 5000000) {
    // 50 lakh to 1 crore
    surchargeRate = 0.10;
    surcharge = taxAfterRebate * surchargeRate;
  }

  // Calculate cess
  const taxWithSurcharge = taxAfterRebate + surcharge;
  const cess = taxWithSurcharge * CESS_RATE;
  const totalTaxPayable = taxWithSurcharge + cess;

  return {
    slabBreakdown,
    totalTax,
    rebate,
    taxAfterRebate,
    surcharge,
    surchargeRate,
    cess,
    totalTaxPayable,
  };
}

const calculation = computed(() => {
  const salary = annualSalary.value || 0;

  // 80CCD(2): employer NPS contribution (annual), capped at 14% of Basic + DA
  const enteredNps = Math.max(0, npsAnnual.value || 0);
  const basicDA = Math.max(0, basicPlusDA.value || 0);
  const npsCap = basicDA > 0 ? basicDA * NPS_MAX_RATE : Infinity;
  const npsDeduction = Math.min(enteredNps, npsCap);
  const npsCapped = enteredNps > npsDeduction;

  const taxableIncome = Math.max(
    0,
    salary - STANDARD_DEDUCTION - npsDeduction,
  );

  const tax = computeTaxFor(taxableIncome);

  // Final calculations
  const totalTaxPayable = tax.totalTaxPayable;
  const netAnnualIncome = salary - totalTaxPayable;
  const monthlyInHand = netAnnualIncome / 12;

  // Cash in-hand also excludes the NPS contribution (locked in the NPS account,
  // not received as spendable salary).
  const npsContributed = enteredNps;
  const cashInHandAnnual = salary - npsContributed - totalTaxPayable;
  const monthlyInHandAfterNps = cashInHandAnnual / 12;

  return {
    grossSalary: salary,
    standardDeduction: STANDARD_DEDUCTION,
    npsDeduction,
    npsContributed,
    npsCap,
    npsCapped,
    taxableIncome,
    slabBreakdown: tax.slabBreakdown,
    totalTaxBeforeRebate: tax.totalTax,
    rebate: tax.rebate,
    taxAfterRebate: tax.taxAfterRebate,
    surcharge: tax.surcharge,
    surchargeRate: tax.surchargeRate,
    cess: tax.cess,
    totalTaxPayable,
    netAnnualIncome,
    monthlyInHand,
    monthlyInHandAfterNps,
  };
});

// Suggest the employer NPS (80CCD(2)) that minimises tax by bringing taxable
// income down to the ₹12L rebate threshold, bounded by the 14% of Basic+DA cap.
const npsSuggestion = computed(() => {
  const salary = annualSalary.value || 0;
  const basicDA = Math.max(0, basicPlusDA.value || 0);
  const cap = basicDA > 0 ? basicDA * NPS_MAX_RATE : Infinity;

  // NPS needed to pull taxable income (salary − std. deduction) to ₹12L
  const npsToReach12L = salary - STANDARD_DEDUCTION - REBATE_LIMIT;

  const empty = {
    applicable: false,
    suggestedTotalNps: 0,
    additionalNps: 0,
    reachesZero: false,
    optimalTax: 0,
    saving: 0,
    capped: false,
  };

  // Already at/below ₹12L taxable with no NPS → zero tax, nothing to optimise
  if (npsToReach12L <= 0) {
    return empty;
  }

  const suggestedTotalNps = Math.min(npsToReach12L, cap);
  const reachesZero = suggestedTotalNps >= npsToReach12L;

  const optimalTaxable = Math.max(
    0,
    salary - STANDARD_DEDUCTION - suggestedTotalNps,
  );
  const optimalTax = computeTaxFor(optimalTaxable).totalTaxPayable;
  const saving = calculation.value.totalTaxPayable - optimalTax;
  const additionalNps = suggestedTotalNps - calculation.value.npsDeduction;

  return {
    // Only suggest when there's tax to save AND more NPS to route
    applicable: saving > 0 && additionalNps > 0,
    suggestedTotalNps,
    additionalNps,
    reachesZero,
    optimalTax,
    saving,
    capped: !reachesZero,
  };
});

// Tax already saved by the current employer NPS deduction (vs no NPS at all).
const npsSavings = computed(() => {
  const salary = annualSalary.value || 0;
  const taxWithoutNps = computeTaxFor(
    Math.max(0, salary - STANDARD_DEDUCTION),
  ).totalTaxPayable;
  const saved = taxWithoutNps - calculation.value.totalTaxPayable;
  return {
    applicable: calculation.value.npsDeduction > 0 && saved > 0,
    saved,
  };
});

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercentage = (rate: number): string => {
  return `${(rate * 100).toFixed(0)}%`;
};
</script>

<template>
  <ToolLayout
    :name="Tools.IndiaIncomeTax"
    print-title="Tax Calculation (New Regime FY 2025-26)"
  >
    <div class="space-y-6">
      <NumberInput
        id="india-tax-salary"
        label="Annual Salary (₹)"
        placeholder="Enter your annual salary"
        v-model="annualSalary"
        :min="0"
        :step="10000"
      />

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <NumberInput
          id="india-tax-nps"
          label="Employer NPS — 80CCD(2) (₹)"
          placeholder="Annual employer NPS"
          v-model="npsAnnual"
          :min="0"
          :step="10000"
        />
        <NumberInput
          id="india-tax-basic"
          label="Basic Salary — annual (₹)"
          placeholder="Defaults to 50% of salary"
          v-model="basicSalary"
          :min="0"
          :step="10000"
        />
        <NumberInput
          id="india-tax-da"
          label="DA — annual (₹)"
          placeholder="Dearness allowance"
          v-model="dearnessAllowance"
          :min="0"
          :step="10000"
        />
      </div>
      <p
        v-if="basicPlusDA > 0"
        class="text-xs text-gray-500 -mt-3 print:hidden"
      >
        Basic + DA = {{ formatCurrency(basicPlusDA) }}<template
          v-if="basicAssumed"
        >
          (Basic assumed 50% of salary)</template
        >
        · NPS cap (14%) = {{ formatCurrency(basicPlusDA * 0.14) }}
      </p>

      <div class="space-y-4">
        <!-- NPS Tax-Saved Banner -->
        <div
          v-if="npsSavings.applicable"
          class="print:hidden outline outline-emerald-300 bg-emerald-100 p-4 flex items-baseline justify-between gap-3"
        >
          <span class="text-sm font-medium text-emerald-900"
            >Tax saved with employer NPS</span
          >
          <span class="font-mono text-lg font-medium text-emerald-800"
            >{{ formatCurrency(npsSavings.saved) }}</span
          >
        </div>

        <!-- Summary Section -->
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-gray-700">Income Summary</h3>
          <div class="outline outline-gray-200 p-3 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Gross Annual Salary</span>
              <span class="font-mono">{{
                formatCurrency(calculation.grossSalary)
              }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Standard Deduction</span>
              <span class="font-mono text-green-600"
                >- {{ formatCurrency(calculation.standardDeduction) }}</span
              >
            </div>
            <div
              v-if="calculation.npsDeduction > 0"
              class="flex justify-between text-sm"
            >
              <span class="text-gray-600"
                >Employer NPS
                <span class="text-xs text-gray-500">(80CCD(2))</span></span
              >
              <span class="font-mono text-green-600"
                >- {{ formatCurrency(calculation.npsDeduction) }}</span
              >
            </div>
            <div
              v-if="calculation.npsCapped"
              class="print:hidden text-xs text-amber-600"
            >
              NPS deduction capped at 14% of Basic + DA
              ({{ formatCurrency(calculation.npsCap) }}).
            </div>
            <div
              class="flex justify-between text-sm pt-2 border-t border-gray-200"
            >
              <span class="font-medium text-gray-700">Taxable Income</span>
              <span class="font-mono font-medium">{{
                formatCurrency(calculation.taxableIncome)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Tax Calculation by Slab -->
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-gray-700">
            Tax Calculation (New Regime)
          </h3>
          <div class="outline outline-gray-200 p-3 space-y-2">
            <div
              v-for="(slab, index) in calculation.slabBreakdown"
              :key="index"
              class="grid grid-cols-[2fr_1fr_2fr_2fr] gap-x-3 text-sm items-center"
            >
              <span class="text-gray-600">{{ slab.label }}</span>
              <span class="text-gray-500 text-right">{{ formatPercentage(slab.rate) }}</span>
              <span class="text-gray-500 text-right whitespace-nowrap">
                {{ formatCurrency(slab.taxableAmount) }} × {{ formatPercentage(slab.rate) }}
              </span>
              <span class="font-mono text-gray-700 text-right whitespace-nowrap">{{
                formatCurrency(slab.tax)
              }}</span>
            </div>

            <div
              v-if="calculation.slabBreakdown.length === 0"
              class="text-sm text-gray-500"
            >
              No tax liability
            </div>

            <div
              v-if="calculation.slabBreakdown.length > 0"
              class="flex justify-between text-sm pt-2 border-t border-gray-200"
            >
              <span class="font-medium text-gray-700">Total Tax</span>
              <span class="font-mono font-medium">{{
                formatCurrency(calculation.totalTaxBeforeRebate)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Deductions and Additions -->
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-gray-700">
            Adjustments & Cess
          </h3>
          <div class="outline outline-gray-200 p-3 space-y-2">
            <div v-if="calculation.rebate > 0" class="flex justify-between text-sm">
              <span class="text-gray-600"
                >Rebate u/s 87A
                <span class="text-xs text-gray-500"
                  >{{
                    calculation.taxableIncome > REBATE_LIMIT
                      ? "(marginal relief)"
                      : "(Income ≤ ₹12L)"
                  }}</span
                ></span
              >
              <span class="font-mono text-green-600"
                >- {{ formatCurrency(calculation.rebate) }}</span
              >
            </div>

            <div
              v-if="calculation.rebate > 0"
              class="flex justify-between text-sm pt-2 border-t border-gray-200"
            >
              <span class="text-gray-600">Tax after Rebate</span>
              <span class="font-mono">{{
                formatCurrency(calculation.taxAfterRebate)
              }}</span>
            </div>

            <div
              v-if="calculation.surcharge > 0"
              class="flex justify-between text-sm"
            >
              <span class="text-gray-600"
                >Surcharge
                <span class="text-xs text-gray-500"
                  >({{ formatPercentage(calculation.surchargeRate) }})</span
                ></span
              >
              <span class="font-mono text-red-600"
                >+ {{ formatCurrency(calculation.surcharge) }}</span
              >
            </div>

            <div class="flex justify-between text-sm">
              <span class="text-gray-600"
                >Health & Education Cess
                <span class="text-xs text-gray-500">(4%)</span></span
              >
              <span class="font-mono text-red-600"
                >+ {{ formatCurrency(calculation.cess) }}</span
              >
            </div>
          </div>
        </div>

        <!-- Final Summary -->
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-gray-700">Final Summary</h3>
          <div class="outline outline-gray-200 p-3 space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Total Tax Payable</span>
              <span class="font-mono">{{
                formatCurrency(calculation.totalTaxPayable)
              }}</span>
            </div>

            <div
              class="flex justify-between text-sm pt-3 border-t border-gray-200"
            >
              <span class="text-gray-600">Net Annual Income</span>
              <span class="font-mono">{{
                formatCurrency(calculation.netAnnualIncome)
              }}</span>
            </div>

            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Monthly In-Hand</span>
              <span class="font-mono">{{
                formatCurrency(calculation.monthlyInHand)
              }}</span>
            </div>

            <div
              v-if="calculation.npsContributed > 0"
              class="flex justify-between text-sm pt-3 border-t border-gray-200"
            >
              <span class="text-gray-600"
                >Monthly In-Hand
                <span class="text-xs text-gray-500"
                  >(after NPS diverted)</span
                ></span
              >
              <span class="font-mono">{{
                formatCurrency(calculation.monthlyInHandAfterNps)
              }}</span>
            </div>
          </div>
        </div>

        <!-- NPS Optimisation Suggestion -->
        <div
          v-if="npsSuggestion.applicable"
          class="outline outline-emerald-200 bg-emerald-50 p-4 space-y-2"
        >
          <h3 class="text-sm font-medium text-emerald-800">
            Suggested NPS to minimise tax
          </h3>
          <p class="text-sm text-emerald-900">
            Route
            <span class="font-mono font-medium">{{
              formatCurrency(npsSuggestion.additionalNps)
            }}</span>
            <template v-if="calculation.npsDeduction > 0"> more</template>
            through employer NPS (80CCD(2)) — total
            <span class="font-mono font-medium">{{
              formatCurrency(npsSuggestion.suggestedTotalNps)
            }}</span>
            — to save
            <span class="font-mono font-medium">{{
              formatCurrency(npsSuggestion.saving)
            }}</span>
            in tax<template v-if="npsSuggestion.reachesZero">, bringing your
            total tax to
            <span class="font-mono font-medium">{{
              formatCurrency(npsSuggestion.optimalTax)
            }}</span></template
            >.
          </p>
          <p v-if="npsSuggestion.capped" class="text-xs text-emerald-700">
            Limited by the 14% of Basic + DA cap ({{
              basicAssumed ? "Basic assumed 50% of salary" : "from your Basic + DA"
            }}) — a higher NPS contribution is not eligible for deduction.
          </p>
        </div>

        <!-- Info Note -->
        <div class="text-xs text-gray-500 space-y-1 pt-2">
          <p>
            This calculator uses the <strong>New Tax Regime</strong> rates for FY
            2025-26 (AY 2026-27).
          </p>
          <p>
            Standard deduction of ₹75,000 is automatically applied for salaried
            employees.
          </p>
          <p>
            Employer NPS contribution under Section 80CCD(2) is deductible under
            the new regime, up to 14% of Basic + DA. If Basic is left blank, it's
            assumed to be 50% of your annual salary; enter your actual Basic (and
            DA) for a precise cap.
          </p>
          <p>
            Rebate under Section 87A (up to ₹60,000) applies if taxable income
            is ≤ ₹12 lakh. Just above ₹12 lakh, marginal relief caps the tax at
            the amount of income exceeding ₹12 lakh.
          </p>
        </div>
      </div>
    </div>
  </ToolLayout>
</template>
