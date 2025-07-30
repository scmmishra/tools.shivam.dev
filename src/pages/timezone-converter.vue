<script setup lang="ts">
import { ref, computed } from "vue";
import { Tools } from "../tools";
import ToolLayout from "../components/ToolLayout.vue";
import TextInput from "../components/form/TextInput.vue";
import Select from "../components/form/Select.vue";
import Result from "../components/Result.vue";
import WithLabel from "../components/form/WithLabel.vue";
import IconTrash from "~icons/ph/trash";
import IconPlus from "~icons/ph/plus";

const inputTime = ref("");
const inputTimezone = ref("UTC");
const additionalTimezones = ref<Array<{ id: string; timezone: string }>>([
  { id: "1", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }
]);

const error = ref("");

const timezones = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New York (EST/EDT)" },
  { value: "America/Chicago", label: "America/Chicago (CST/CDT)" },
  { value: "America/Denver", label: "America/Denver (MST/MDT)" },
  { value: "America/Los_Angeles", label: "America/Los Angeles (PST/PDT)" },
  { value: "America/Toronto", label: "America/Toronto" },
  { value: "America/Vancouver", label: "America/Vancouver" },
  { value: "America/Mexico_City", label: "America/Mexico City" },
  { value: "America/Sao_Paulo", label: "America/São Paulo" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "Europe/Moscow", label: "Europe/Moscow" },
  { value: "Europe/Amsterdam", label: "Europe/Amsterdam" },
  { value: "Europe/Rome", label: "Europe/Rome" },
  { value: "Europe/Madrid", label: "Europe/Madrid" },
  { value: "Asia/Dubai", label: "Asia/Dubai" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai" },
  { value: "Asia/Hong_Kong", label: "Asia/Hong Kong" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
  { value: "Asia/Seoul", label: "Asia/Seoul" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEDT/AEST)" },
  { value: "Australia/Melbourne", label: "Australia/Melbourne" },
  { value: "Australia/Perth", label: "Australia/Perth" },
  { value: "Pacific/Auckland", label: "Pacific/Auckland (NZDT/NZST)" },
  { value: "Pacific/Honolulu", label: "Pacific/Honolulu (HST)" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg" },
  { value: "Africa/Cairo", label: "Africa/Cairo" },
  { value: "Africa/Lagos", label: "Africa/Lagos" },
  { value: Intl.DateTimeFormat().resolvedOptions().timeZone, label: "Local Time" }
];

const uniqueTimezones = computed(() => {
  const seen = new Set();
  return timezones.filter(tz => {
    if (seen.has(tz.value)) return false;
    seen.add(tz.value);
    return true;
  });
});

const persistKeys = computed(() => [
  'timezone-converter-input',
  'timezone-converter-input-tz',
  ...additionalTimezones.value.map(tz => `timezone-converter-tz-${tz.id}`)
]);

function parseDateTime(input: string, sourceTimezone: string): Date | null {
  if (!input.trim()) return null;

  const trimmed = input.trim();

  // Unix timestamps are always UTC
  if (/^\d+$/.test(trimmed)) {
    const timestamp = parseInt(trimmed);
    if (timestamp > 1e12) {
      return new Date(timestamp);
    } else {
      return new Date(timestamp * 1000);
    }
  }

  // Try parsing with timezone suffix first
  if (trimmed.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // For dates without timezone, interpret in the source timezone
  const dateMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}:\d{2}(?:\.\d{3})?))?$/);
  if (dateMatch) {
    const dateStr = dateMatch[1];
    const timeStr = dateMatch[2] || '00:00:00';

    // Parse the date components
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute, second] = timeStr.split(':').map(Number);

    // Create a date in the source timezone
    const testDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    // Adjust for timezone offset
    const offset = getTimezoneOffset(testDate, sourceTimezone);
    return new Date(testDate.getTime() - offset * 60000);
  }

  // Try generic parsing as last resort
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
}

function getTimezoneOffset(date: Date, timezone: string): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return (tzDate.getTime() - utcDate.getTime()) / 60000;
}

function formatInTimezone(date: Date, timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short'
    });

    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

    return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')} ${getPart('timeZoneName')}`;
  } catch (e) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }
}

function getConvertedTimeForTimezone(targetTimezone: string) {
  if (!inputTime.value.trim() || !targetTimezone) {
    return { label: "", time: "" };
  }

  try {
    const date = parseDateTime(inputTime.value, inputTimezone.value);
    if (!date) {
      error.value = "Invalid date/time format. Try: YYYY-MM-DD HH:MM:SS, ISO 8601, or Unix timestamp";
      return { label: "", time: "" };
    }

    error.value = "";

    // Convert from input timezone to target timezone
    const convertedTime = formatInTimezone(date, targetTimezone);
    const timezoneOption = uniqueTimezones.value.find(tz => tz.value === targetTimezone);
    const label = timezoneOption?.label || targetTimezone;

    return { label, time: convertedTime };
  } catch (e) {
    return { label: "", time: "" };
  }
}

function addTimezone() {
  const id = Date.now().toString();
  additionalTimezones.value.push({ id, timezone: "UTC" });
}

function removeTimezone(id: string) {
  additionalTimezones.value = additionalTimezones.value.filter(tz => tz.id !== id);
}

function updateTimezone(id: string, value: string | undefined) {
  if (!value) return;
  const tz = additionalTimezones.value.find(tz => tz.id === id);
  if (tz) {
    tz.timezone = value;
  }
}
</script>

<template>
  <ToolLayout :name="Tools.TimezoneConverter" :persist-keys="persistKeys">
    <div class="space-y-4">
      <!-- Input Row -->
      <div class="grid grid-cols-9 gap-4">
        <div class="col-span-5">
          <TextInput
            id="time-input"
            label="Time Input"
            placeholder="2024-01-15 14:30:00, ISO 8601, or Unix timestamp"
            v-model="inputTime"
            persist="timezone-converter-input"
          />
        </div>
        <div class="col-span-3">
          <Select
            id="input-timezone"
            label="Timezone"
            :options="uniqueTimezones"
            v-model="inputTimezone"
            persist="timezone-converter-input-tz"
          />
        </div>
        <div class="col-span-1">
          <!-- Empty space for alignment -->
        </div>
      </div>

      <div v-if="error" class="text-red-600 text-sm">
        {{ error }}
      </div>

      <!-- Output Rows -->
      <div v-for="tz in additionalTimezones" :key="tz.id" class="grid grid-cols-9 gap-4">
        <div class="col-span-5">
          <Result
            :title="getConvertedTimeForTimezone(tz.timezone).label"
            :value="getConvertedTimeForTimezone(tz.timezone).time"
            placeholder="Select a timezone"
          />
        </div>
        <div class="col-span-3">
          <Select
            :id="`timezone-${tz.id}`"
            label="Target Timezone"
            :options="uniqueTimezones"
            :model-value="tz.timezone"
            @update:model-value="updateTimezone(tz.id, $event)"
            :persist="`timezone-converter-tz-${tz.id}`"
          />
        </div>
        <div class="col-span-1">
          <WithLabel label="&nbsp;" :html-for="`remove-${tz.id}`">
            <button
              :id="`remove-${tz.id}`"
              @click="removeTimezone(tz.id)"
              class="w-full px-3 py-2.5 outline outline-gray-200 hover:outline-gray-400 transition-colors flex items-center justify-center"
              aria-label="Remove timezone"
              :disabled="additionalTimezones.length === 1"
            >
              <IconTrash class="text-gray-600" />
            </button>
          </WithLabel>
        </div>
      </div>

      <!-- Add Button -->
      <button
        @click="addTimezone"
        class="w-full px-4 py-2 bg-gray-900 text-gray-100 hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
      >
        <IconPlus />
        Add Timezone
      </button>
    </div>
  </ToolLayout>
</template>
