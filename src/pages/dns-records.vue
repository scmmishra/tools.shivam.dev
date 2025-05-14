<script setup lang="ts">
import { ref, computed } from "vue";
import TextInput from "../components/form/TextInput.vue";
import ToolLayout from "../components/ToolLayout.vue";
import { Tools } from "../tools";
import { isIPV4Address, isIPV6Address } from "../utils/validate";

interface DnsRecord {
  type: string;
  name: string;
  ttl: number;
  data: string;
  warning?: string;
}

interface RecordSection {
  title: string;
  description: string;
  records: DnsRecord[];
}

const recordTypes = {
  A: { id: 1, description: "Maps domain to IPv4 addresses" },
  NS: { id: 2, description: "Specifies authoritative nameservers" },
  CNAME: { id: 5, description: "Creates an alias pointing to another domain" },
  SOA: {
    id: 6,
    description: "Start of Authority - Contains domain administration info",
  },
  MX: { id: 15, description: "Specifies mail servers for the domain" },
  TXT: {
    id: 16,
    description: "Stores text information (SPF, DKIM, verification)",
  },
  AAAA: { id: 28, description: "Maps domain to IPv6 addresses" },
  SRV: { id: 33, description: "Service records for various protocols" },
  CAA: {
    id: 257,
    description:
      "Specifies which Certificate Authorities can issue SSL certificates",
  },
};

const domain = ref("");
const loading = ref(false);
const error = ref("");
const dnsRecords = ref<any[]>([]);

const validateARecords = (records: DnsRecord[]) => {
  return records.map((record) => ({
    ...record,
    warning: !isIPV4Address(record.data)
      ? "Invalid IPv4 address format"
      : undefined,
  }));
};

const validateAAAARecords = (records: DnsRecord[]) => {
  return records.map((record) => ({
    ...record,
    warning: !isIPV6Address(record.data)
      ? "Invalid IPv6 address format"
      : undefined,
  }));
};

const validateMXRecords = (records: DnsRecord[]) => {
  if (records.length === 0) return records;

  const priorities = new Set();

  return records.map((record) => {
    const priority = parseInt(record.data.split(" ")[0]);
    const hasDuplicate = priorities.has(priority);
    priorities.add(priority);

    let warning;
    if (hasDuplicate) {
      warning = "Duplicate MX priority";
    }

    return { ...record, warning };
  });
};

const validateTXTRecords = (records: DnsRecord[]) => {
  const hasSpf = records.some((r) => r.data.startsWith("v=spf1"));

  return records.map((record) => {
    let warning;
    if (record.data.length > 255) {
      warning = "TXT record exceeds 255 characters";
    } else if (record.data.includes("spf1") && !hasSpf) {
      warning = "SPF record found but no v=spf1 TXT record exists";
    }
    return { ...record, warning };
  });
};

const validateNSRecords = (records: DnsRecord[]) => {
  return records.map((record, index) => ({
    ...record,
    warning:
      records.length < 2 && index === 0
        ? "Less than 2 nameservers (recommended minimum is 2)"
        : undefined,
  }));
};

const formattedRecords = computed((): DnsRecord[] => {
  return dnsRecords.value.map((record) => ({
    type:
      Object.keys(recordTypes).find((k) => recordTypes[k].id === record.type) ||
      `TYPE${record.type}`,
    name: record.name,
    ttl: record.TTL,
    data: record.data,
    warning: undefined,
  }));
});

const sections = computed((): RecordSection[] => {
  const records = formattedRecords.value;

  return Object.entries(recordTypes)
    .map(([type, info]) => ({
      title: `${type} Records`,
      description: info.description,
      records: (() => {
        const typeRecords = records.filter((r) => r.type === type);
        switch (type) {
          case "A":
            return validateARecords(typeRecords);
          case "AAAA":
            return validateAAAARecords(typeRecords);
          case "MX":
            return validateMXRecords(typeRecords);
          case "TXT":
            return validateTXTRecords(typeRecords);
          case "NS":
            return validateNSRecords(typeRecords);
          default:
            return typeRecords;
        }
      })(),
    }))
    .filter((section) => section.records.length > 0);
});

const updateDomain = (value: string | undefined) => {
  domain.value = value ?? "";
};

const fetchDnsRecords = async () => {
  if (!domain.value) {
    error.value = "Please enter a domain";
    return;
  }

  loading.value = true;
  error.value = "";
  dnsRecords.value = [];

  try {
    const records = await Promise.all(
      Object.values(recordTypes).map(async ({ id }) => {
        const response = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(domain.value)}&type=${id}`,
        );
        const data = await response.json();
        return data.Answer || [];
      }),
    );

    dnsRecords.value = records.flat();

    if (dnsRecords.value.length === 0) {
      error.value = "No DNS records found";
    }
  } catch (e) {
    error.value =
      e instanceof Error ? e.message : "Failed to fetch DNS records";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <ToolLayout :name="Tools.DnsRecords" :persist-keys="['dns-domain']">
    <div class="space-y-6">
      <div class="text-gray-600">
        Records are queried using Google's Public DNS servers (8.8.8.8). Results
        may differ from your DNS provider.
      </div>

      <div class="flex gap-4">
        <TextInput
          id="dns-domain"
          v-model="domain"
          label="Domain"
          placeholder="example.com"
          persist="dns-domain"
          @update="updateDomain"
          @keyup.enter="fetchDnsRecords"
          class="flex-1"
        />

        <button
          class="mt-6 h-10 px-4 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          :disabled="loading || !domain"
          @click="fetchDnsRecords"
        >
          {{ loading ? "Loading..." : "Lookup" }}
        </button>
      </div>

      <div v-if="error" class="p-4 text-sm text-red-600 bg-red-50 rounded">
        {{ error }}
      </div>

      <template v-for="section in sections" :key="section.title">
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-medium text-gray-900">
              {{ section.title }}
            </h3>
            <p class="mt-1 text-sm text-gray-500">{{ section.description }}</p>
          </div>

          <div class="overflow-hidden shadow ring-1 ring-gray-200 rounded">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900"
                  >
                    Name
                  </th>
                  <th
                    class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    TTL
                  </th>
                  <th
                    class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Data
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr
                  v-for="record in section.records"
                  :key="`${record.type}-${record.data}`"
                  :class="{ 'bg-yellow-50': record.warning }"
                >
                  <td
                    class="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-mono text-gray-500"
                  >
                    {{ record.name }}
                  </td>
                  <td
                    class="whitespace-nowrap px-3 py-3 text-sm font-mono text-gray-500"
                  >
                    {{ record.ttl }}
                  </td>
                  <td class="px-3 py-3">
                    <div
                      class="text-sm font-mono text-gray-500 whitespace-pre-wrap break-all"
                    >
                      {{ record.data }}
                    </div>
                    <div
                      v-if="record.warning"
                      class="mt-1 text-sm text-yellow-700"
                    >
                      ⚠️ {{ record.warning }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </ToolLayout>
</template>
