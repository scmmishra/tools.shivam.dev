export type DnsRecordType = 
  | 'A' 
  | 'NS' 
  | 'CNAME' 
  | 'SOA' 
  | 'MX' 
  | 'TXT' 
  | 'AAAA' 
  | 'SRV' 
  | 'CAA';

export type Severity = 'error' | 'warning' | 'info';

export interface DnsRecord {
  type: DnsRecordType;
  name: string;
  ttl: number;
  data: string;
  warning?: string;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: ValidationWarning[];
  errors: ValidationWarning[];
}

export interface ValidationWarning {
  code: string;
  message: string;
  severity: Severity;
  metadata?: Record<string, unknown>;
  recordIndex?: number;
}

export interface DnsValidationContext {
  domain: string;
  records: DnsRecord[];
  allRecords?: DnsRecord[];
}

export interface DnsValidator {
  validate(context: DnsValidationContext): ValidationResult;
}

export interface DnsLookupOptions {
  type: DnsRecordType;
  name: string;
  server?: string;
}

export interface DnsResponse {
  Status: number;
  TC: boolean;
  RD: boolean;
  RA: boolean;
  AD: boolean;
  CD: boolean;
  Question: Array<{
    name: string;
    type: number;
  }>;
  Answer?: Array<{
    name: string;
    type: number;
    TTL: number;
    data: string;
  }>;
}

export interface ValidatorFunction {
  (record: DnsRecord, context: DnsValidationContext): ValidationWarning | undefined;
}

export interface DnsValidatorOptions {
  strict?: boolean;
  checkBestPractices?: boolean;
  customRules?: Record<string, ValidatorFunction>;
}