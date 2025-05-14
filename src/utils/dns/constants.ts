import type { DnsRecordType } from "./types";

export const TTL_RANGES = {
  MIN_RECOMMENDED: 300, // 5 minutes
  MAX_RECOMMENDED: 86400, // 24 hours
  CRITICAL_MIN: 60, // 1 minute
  CRITICAL_MAX: 604800, // 1 week
} as const;

export const DNS_RECORD_TYPES: Record<DnsRecordType, number> = {
  A: 1,
  NS: 2,
  CNAME: 5,
  SOA: 6,
  MX: 15,
  TXT: 16,
  AAAA: 28,
  SRV: 33,
  CAA: 257,
} as const;

export const VALIDATION_MESSAGES = {
  SOA: {
    INVALID_FORMAT: "Invalid SOA record format",
    INVALID_RNAME: "Invalid RNAME format: not a valid email address",
    INVALID_SERIAL: "SOA serial number: recommended format is YYYYMMDDnn",
    INVALID_SERIAL_DATE: "SOA serial number: invalid date in YYYYMMDDnn format",
    NO_NS_RECORDS: "No NS records found to validate against SOA MNAME",
    MNAME_MISMATCH: "SOA MNAME must match one of the NS records",
    TTL_TOO_LOW: "SOA minimum TTL is less than recommended 1 hour",
    TTL_TOO_HIGH: "SOA minimum TTL exceeds recommended 24 hours",
  },
  CNAME: {
    APEX_RECORD:
      "CNAME record not allowed at apex/root domain - use A/AAAA records instead",
    COEXISTENCE:
      "CNAME record cannot coexist with other record types for the same name",
  },
  MX: {
    DUPLICATE_PRIORITY: "Duplicate MX priority found",
    NULL_MX_FORMAT: "Invalid null MX format (RFC 7505)",
    DEPRECATED_CONFIG: "Deprecated or insecure MX configuration detected",
  },
  SPF: {
    MULTIPLE_RECORDS: "Multiple SPF records found (only one allowed)",
    INVALID_SYNTAX: "Invalid SPF record syntax",
    MISSING_PROVIDER: "Missing expected provider include mechanism",
    INVALID_IP_RANGE: "Invalid IP range in SPF record",
  },
  DMARC: {
    MISSING_RECORD: "No DMARC record found at _dmarc subdomain",
    INVALID_VERSION: "Invalid DMARC version tag (must be DMARC1)",
    MISSING_POLICY: "Missing required policy (p=) tag",
    DUPLICATE_RECORD: "Multiple DMARC records found",
    INVALID_POLICY:
      "Invalid policy value (must be none, quarantine, or reject)",
    INVALID_PCT: "Invalid percentage value (must be between 0-100)",
    INVALID_URI: "Invalid reporting URI format",
    TOO_MANY_URIS: "Too many reporting URIs (maximum 2)",
    URI_TOO_LONG: "Reporting URI exceeds 256 characters",
    INVALID_INTERVAL:
      "Invalid reporting interval (must be between 3600 and 86400)",
    INVALID_FO: "Invalid failure reporting options",
    RECORD_TOO_LONG: "DMARC record exceeds 2048 characters",
  },
  CAA: {
    INVALID_TAG: "Invalid CAA tag format",
    UNKNOWN_CA: "Unknown Certificate Authority specified",
    INVALID_IODEF: "Invalid IODEF reporting configuration",
    INCOMPLETE_COVERAGE: "Incomplete CA coverage",
  },
  SRV: {
    INVALID_FORMAT: "Invalid SRV record format",
    INVALID_PRIORITY: "Invalid priority value",
    INVALID_WEIGHT: "Invalid weight value",
    INVALID_PORT: "Invalid port number",
    INVALID_SERVICE: "Invalid service/protocol combination",
  },
  TTL: {
    INCONSISTENT: "Inconsistent TTL values across record set",
    TOO_LOW: "TTL value below recommended minimum",
    TOO_HIGH: "TTL value exceeds recommended maximum",
    MISCONFIGURED: "Misconfigured TTL for record type",
  },
} as const;

export const SEVERITY = {
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
} as const;

export const KNOWN_PROVIDERS = {
  GOOGLE_WORKSPACE: {
    spf: ["include:_spf.google.com"],
    mx: ["aspmx.l.google.com"],
  },
  MICROSOFT_365: {
    spf: ["include:spf.protection.outlook.com"],
    mx: [".mail.protection.outlook.com"],
  },
  AWS_SES: {
    spf: ["include:amazonses.com"],
  },
  ZOHO: {
    spf: ["include:zoho.com"],
    mx: ["mx.zoho.com"],
  },
} as const;

export const EMAIL_PROVIDERS = {
  GOOGLE: ["gmail.com", "googlemail.com"],
  MICROSOFT: ["hotmail.com", "outlook.com", "live.com"],
  YAHOO: ["yahoo.com", "ymail.com"],
  PROTON: ["proton.me", "protonmail.com", "protonmail.ch"],
} as const;
