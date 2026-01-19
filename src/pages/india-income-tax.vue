<script setup lang="ts">
import { ref, computed } from "vue";
import { Tools } from "../tools";
import ToolLayout from "../components/ToolLayout.vue";
import NumberInput from "../components/form/NumberInput.vue";

const annualSalary = ref(1000000);

const STANDARD_DEDUCTION = 75000;
const REBATE_LIMIT = 1200000;
const MAX_REBATE = 60000;
const CESS_RATE = 0.04;

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

const calculation = computed(() => {
  const salary = annualSalary.value || 0;
  const taxableIncome = Math.max(0, salary - STANDARD_DEDUCTION);

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

  // Apply rebate under Section 87A
  const rebate =
    taxableIncome <= REBATE_LIMIT ? Math.min(totalTax, MAX_REBATE) : 0;
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

  // Final calculations
  const totalTaxPayable = taxWithSurcharge + cess;
  const netAnnualIncome = salary - totalTaxPayable;
  const monthlyInHand = netAnnualIncome / 12;

  return {
    grossSalary: salary,
    standardDeduction: STANDARD_DEDUCTION,
    taxableIncome,
    slabBreakdown,
    totalTaxBeforeRebate: totalTax,
    rebate,
    taxAfterRebate,
    surcharge,
    surchargeRate,
    cess,
    totalTaxPayable,
    netAnnualIncome,
    monthlyInHand,
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
  <ToolLayout :name="Tools.IndiaIncomeTax" :persist-keys="['india-tax-salary']">
    <div class="space-y-6">
      <NumberInput
        id="india-tax-salary"
        label="Annual Salary (₹)"
        placeholder="Enter your annual salary"
        v-model="annualSalary"
        persist="india-tax-salary"
        :min="0"
        :step="10000"
      />

      <div class="space-y-4">
        <!-- Summary Section -->
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-gray-700">Income Summary</h3>
          <div class="outline outline-gray-200 p-4 space-y-2">
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
          <div class="outline outline-gray-200 p-4 space-y-3">
            <div
              v-for="(slab, index) in calculation.slabBreakdown"
              :key="index"
              class="space-y-1"
            >
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">{{ slab.label }}</span>
                <span class="text-gray-500">{{ formatPercentage(slab.rate) }}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-gray-500"
                  >{{ formatCurrency(slab.taxableAmount) }} ×
                  {{ formatPercentage(slab.rate) }}</span
                >
                <span class="font-mono text-gray-700">{{
                  formatCurrency(slab.tax)
                }}</span>
              </div>
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
          <div class="outline outline-gray-200 p-4 space-y-2">
            <div v-if="calculation.rebate > 0" class="flex justify-between text-sm">
              <span class="text-gray-600"
                >Rebate u/s 87A
                <span class="text-xs text-gray-500"
                  >(Income ≤ ₹12L)</span
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
          <div class="outline outline-gray-200 p-4 space-y-3">
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
          </div>
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
            Rebate under Section 87A (up to ₹60,000) applies if total income is
            ≤ ₹12 lakh.
          </p>
        </div>
      </div>
    </div>
  </ToolLayout>
</template>
