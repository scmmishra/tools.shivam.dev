<script setup lang="ts">
import { ref, computed } from 'vue'
import TextInput from '../components/form/TextInput.vue'
import ToolLayout from '../components/ToolLayout.vue'
import { Tools } from '../tools'

const domain = ref('')
const loading = ref(false)
const error = ref('')
const dnsRecords = ref<any[]>([])

interface DnsRecord {
  type: string
  name: string
  ttl: number
  data: string
  warning?: string
}

interface RecordSection {
  title: string
  description: string
  records: DnsRecord[]
  validate?: (records: DnsRecord[]) => void
}

const types: Record<number, string> = {
  1: 'A',
  2: 'NS',
  5: 'CNAME',
  6: 'SOA',
  15: 'MX',
  16: 'TXT',
  28: 'AAAA',
  33: 'SRV',
  257: 'CAA'
}

const validateARecords = (records: DnsRecord[]) => {
  records.forEach(record => {
    if (!record.data.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
      record.warning = 'Invalid IPv4 address format'
    }
  })
}

const validateAAAARecords = (records: DnsRecord[]) => {
  records.forEach(record => {
    if (!record.data.match(/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/)) {
      record.warning = 'Invalid IPv6 address format'
    }
  })
}

const validateMXRecords = (records: DnsRecord[]) => {
  if (records.length === 0) {
    return
  }
  
  // Check if there's a primary MX record with lowest priority
  const hasPrimaryMX = records.some(r => r.data.startsWith('0 '))
  if (!hasPrimaryMX) {
    records[0].warning = 'No primary MX record (priority 0) found'
  }

  // Check for duplicate priorities
  const priorities = new Set()
  records.forEach(record => {
    const priority = parseInt(record.data.split(' ')[0])
    if (priorities.has(priority)) {
      record.warning = 'Duplicate MX priority'
    }
    priorities.add(priority)
  })
}

const validateTXTRecords = (records: DnsRecord[]) => {
  records.forEach(record => {
    if (record.data.length > 255) {
      record.warning = 'TXT record exceeds 255 characters'
    }
    if (record.data.includes('spf1')) {
      const spfRecord = records.find(r => r.data.startsWith('v=spf1'))
      if (!spfRecord) {
        record.warning = 'SPF record found but no v=spf1 TXT record exists'
      }
    }
  })
}

const validateNSRecords = (records: DnsRecord[]) => {
  if (records.length < 2) {
    records[0].warning = 'Less than 2 nameservers (recommended minimum is 2)'
  }
}

const sections = computed((): RecordSection[] => [
  {
    title: 'A Records',
    description: 'Maps domain to IPv4 addresses',
    records: formattedRecords.value.filter(r => r.type === 'A'),
    validate: validateARecords
  },
  {
    title: 'AAAA Records',
    description: 'Maps domain to IPv6 addresses',
    records: formattedRecords.value.filter(r => r.type === 'AAAA'),
    validate: validateAAAARecords
  },
  {
    title: 'CNAME Records',
    description: 'Creates an alias pointing to another domain',
    records: formattedRecords.value.filter(r => r.type === 'CNAME')
  },
  {
    title: 'MX Records',
    description: 'Specifies mail servers for the domain',
    records: formattedRecords.value.filter(r => r.type === 'MX'),
    validate: validateMXRecords
  },
  {
    title: 'TXT Records',
    description: 'Stores text information (SPF, DKIM, verification)',
    records: formattedRecords.value.filter(r => r.type === 'TXT'),
    validate: validateTXTRecords
  },
  {
    title: 'NS Records',
    description: 'Specifies authoritative nameservers',
    records: formattedRecords.value.filter(r => r.type === 'NS'),
    validate: validateNSRecords
  },
  {
    title: 'SOA Record',
    description: 'Start of Authority - Contains domain administration info',
    records: formattedRecords.value.filter(r => r.type === 'SOA')
  },
  {
    title: 'CAA Records',
    description: 'Specifies which Certificate Authorities can issue SSL certificates',
    records: formattedRecords.value.filter(r => r.type === 'CAA')
  },
  {
    title: 'Other Records',
    description: 'Additional DNS records',
    records: formattedRecords.value.filter(r => !['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'CAA'].includes(r.type))
  }
])

const formattedRecords = computed(() => {
  return dnsRecords.value.map(record => ({
    type: types[record.type] || `TYPE${record.type}`,
    name: record.name,
    ttl: record.TTL,
    data: record.data
  }))
})

const updateDomain = (value: string | undefined) => {
  domain.value = value ?? ''
}

const fetchDnsRecords = async () => {
  if (!domain.value) {
    error.value = 'Please enter a domain'
    return
  }

  loading.value = true
  error.value = ''
  dnsRecords.value = []

  try {
    const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain.value)}&type=ANY`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch DNS records')
    }

    if (!data.Answer) {
      error.value = 'No DNS records found'
      return
    }

    dnsRecords.value = data.Answer

    // Run validation for each section
    sections.value.forEach(section => {
      if (section.validate) {
        section.validate(section.records)
      }
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to fetch DNS records'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <ToolLayout :name="Tools.DnsRecords" :persist-keys="['dns-domain']">
    <div class="space-y-6">
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
          {{ loading ? 'Loading...' : 'Lookup' }}
        </button>
      </div>

      <div v-if="error" class="p-4 text-sm text-red-600 bg-red-50 rounded">
        {{ error }}
      </div>

      <template v-for="section in sections" :key="section.title">
        <div v-if="section.records.length" class="space-y-4">
          <div>
            <h3 class="text-lg font-medium text-gray-900">{{ section.title }}</h3>
            <p class="mt-1 text-sm text-gray-500">{{ section.description }}</p>
          </div>

          <div class="overflow-hidden shadow ring-1 ring-gray-200 rounded">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">TTL</th>
                  <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Data</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="record in section.records" :key="`${record.type}-${record.data}`" :class="{ 'bg-yellow-50': record.warning }">
                  <td class="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-mono text-gray-500">
                    {{ record.name }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-3 text-sm font-mono text-gray-500">
                    {{ record.ttl }}
                  </td>
                  <td class="px-3 py-3">
                    <div class="text-sm font-mono text-gray-500 whitespace-pre-wrap break-all">
                      {{ record.data }}
                    </div>
                    <div v-if="record.warning" class="mt-1 text-sm text-yellow-700">
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