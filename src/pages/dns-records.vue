<script setup lang="ts">
import { ref, computed } from "vue";
import TextInput from "../components/form/TextInput.vue";
import ToolLayout from "../components/ToolLayout.vue";
import { Tools } from "../tools";
import { isIPV4Address, isIPV6Address } from "../utils/validate";
import { validateCNAMERecord } from "../utils/dns/cname";
import { validateMXRecord } from "../utils/dns/mx";
import { validateSOARecord } from "../utils/dns/soa";
import { validateSpfRecord } from "../utils/dns/spf";
import { validateDmarcRecord } from "../utils/dns/dmarc";
import type {
  ValidationWarning,
  DnsRecordType,
  DnsRecord,
} from "../utils/dns/types";

// Use the DnsRecord type from types.ts but extend it with our UI-specific fields
interface DnsRecordWithWarnings extends DnsRecord {
  warning?: string;
  warnings?: ValidationWarning[];
}

interface DnsValidationContext {
  domain: string;
  records: DnsRecord[];
  allRecords?: DnsRecord[];
}

interface RecordSection {
  title: string;
  description: string;
  records: DnsRecordWithWarnings[];
}

const recordTypes: Record<DnsRecordType, { id: number; description: string }> =
  {
    A: { id: 1, description: "Maps domain to IPv4 addresses" },
    NS: { id: 2, description: "Specifies authoritative nameservers" },
    CNAME: {
      id: 5,
      description: "Creates an alias pointing to another domain",
    },
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

const validateARecords = (records: DnsRecordWithWarnings[]) => {
  return records.map((record) => ({
    ...record,
    warning: !isIPV4Address(record.data)
      ? "Invalid IPv4 address format"
      : undefined,
  }));
};

const validateAAAARecords = (records: DnsRecordWithWarnings[]) => {
  return records.map((record) => ({
    ...record,
    warning: !isIPV6Address(record.data)
      ? "Invalid IPv6 address format"
      : undefined,
  }));
};

const validateMXRecords = (
  records: DnsRecordWithWarnings[],
  context: DnsValidationContext,
) => {
  if (records.length === 0) return records;

  return records.map((record) => {
    const result = validateMXRecord(record, context);
    const allWarnings = [...result.warnings, ...result.errors];
    return {
      ...record,
      warnings: allWarnings,
      warning: allWarnings[0]?.message,
    };
  });
};

const validateTXTRecords = (
  records: DnsRecordWithWarnings[],
  context: DnsValidationContext,
) => {
  return records.map((record) => {
    // Handle SPF records
    if (record.data.startsWith("v=spf1")) {
      const result = validateSpfRecord(record, context);
      const allWarnings = [...result.warnings, ...result.errors];
      return {
        ...record,
        warnings: allWarnings,
        warning: allWarnings[0]?.message,
      };
    }

    // Handle DMARC records
    if (record.data.startsWith("v=DMARC1")) {
      const result = validateDmarcRecord(record, context);
      const allWarnings = [...result.warnings, ...result.errors];
      return {
        ...record,
        warnings: allWarnings,
        warning: allWarnings[0]?.message,
      };
    }

    // Check for missing DMARC record
    const dmarcRecords = context.allRecords?.filter(
      r => r.type === "TXT" && r.data.startsWith("v=DMARC1")
    );
    if (!dmarcRecords?.length && !record.name.startsWith("_dmarc.")) {
      const hasSpf = context.allRecords?.some(r => r.data.startsWith("v=spf1"));
      if (hasSpf) {
        record.warnings = [{
          code: "missing_dmarc",
          message: "Domain has SPF but no DMARC record - consider adding DMARC protection",
          severity: "warning"
        }];
        record.warning = record.warnings[0].message;
      }
    }

    // Handle other TXT records
    if (!record.warnings) {
      let warning;
      if (record.data.length > 255) {
        warning = "TXT record exceeds 255 characters";
      }
      return { ...record, warning };
    }
    return record;
  });
};

const validateNSRecords = (records: DnsRecordWithWarnings[]) => {
  return records.map((record, index) => ({
    ...record,
    warning:
      records.length < 2 && index === 0
        ? "Less than 2 nameservers (recommended minimum is 2)"
        : undefined,
  }));
};

const formattedRecords = computed((): DnsRecordWithWarnings[] => {
  return dnsRecords.value
    .map((record): DnsRecordWithWarnings | null => {
      const recordType = (Object.keys(recordTypes) as DnsRecordType[]).find(
        (k) => recordTypes[k].id === record.type,
      );
      // Skip records that don't match our supported types
      if (!recordType) return null;
      return {
        type: recordType,
        name: record.name,
        ttl: record.TTL,
        data: record.data,
        warning: undefined,
      } as DnsRecordWithWarnings;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
});

const sections = computed((): RecordSection[] => {
  const records = formattedRecords.value;
  const context: DnsValidationContext = {
    domain: domain.value,
    records: records,
    allRecords: records,
  };

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
            return validateMXRecords(typeRecords, context);
          case "CNAME":
            return typeRecords.map((record) => {
              const result = validateCNAMERecord(record, context);
              const allWarnings = [...result.warnings, ...result.errors];
              return {
                ...record,
                warnings: allWarnings,
                warning: allWarnings[0]?.message,
              };
            });
          case "SOA":
            return typeRecords.map((record) => {
              const result = validateSOARecord(record, context);
              const allWarnings = [...result.warnings, ...result.errors];
              return {
                ...record,
                warnings: allWarnings,
                warning: allWarnings[0]?.message,
              };
            });
          case "TXT":
            return validateTXTRecords(typeRecords, context);
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
          class="mt-6 h-10 px-4 text-sm font-medium text-gray-100 hover:bg-gray-800 bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          :disabled="loading || !domain"
          @click="fetchDnsRecords"
        >
          {{ loading ? "Loading..." : "Lookup" }}
        </button>
      </div>

      <div v-if="error" class="p-4 text-sm text-red-600 bg-red-50">
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

          <div class="overflow-hidden shadow ring-1 ring-gray-200">
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
                    <template
                      v-if="record.warnings && record.warnings.length > 0"
                    >
                      <div
                        v-for="(warning, idx) in record.warnings"
                        :key="idx"
                        class="mt-1 text-sm"
                        :class="
                          warning.severity === 'error'
                            ? 'text-red-700'
                            : 'text-yellow-700'
                        "
                      >
                        {{ warning.severity === "error" ? "❌" : "⚠️" }}
                        {{ warning.message }}
                      </div>
                    </template>
                    <div
                      v-else-if="record.warning"
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
