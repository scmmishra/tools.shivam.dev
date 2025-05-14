import { SEVERITY } from "./constants";
import type {
  DnsRecord,
  DnsValidationContext,
  ValidatorFunction,
  ValidationResult,
  ValidationWarning,
} from "./types";
import { utils } from "./utils";

interface SoaData {
  mname: string; // Primary master nameserver
  rname: string; // Email of the administrator
  serial: number; // Version number of the zone file
  refresh: number; // Time before slave checks for updates
  retry: number; // Time between retries if slave fails to contact master
  expire: number; // Time after which slave stops answering queries if master is down
  minimum: number; // Negative caching TTL
}

// Parse SOA record data into structured format
function parseSOAData(data: string): SoaData | null {
  const parts = data.split(/\s+/);
  if (parts.length !== 7) return null;

  return {
    mname: parts[0],
    rname: parts[1],
    serial: parseInt(parts[2], 10),
    refresh: parseInt(parts[3], 10),
    retry: parseInt(parts[4], 10),
    expire: parseInt(parts[5], 10),
    minimum: parseInt(parts[6], 10),
  };
}

// Validate email format in RNAME field
export const validateRNAME: ValidatorFunction = (record: DnsRecord) => {
  const soaData = parseSOAData(record.data);
  if (!soaData)
    return utils.formatWarning("Invalid SOA record format", SEVERITY.ERROR);

  const rname = soaData.rname.replace(/\.$/, "");
  // Convert DNS format (first.last.example.com) to email format (first.last@example.com)
  const firstDot = rname.indexOf(".");
  if (firstDot === -1)
    return utils.formatWarning(
      "Invalid RNAME format: missing domain part",
      SEVERITY.ERROR,
    );

  const localPart = rname.substring(0, firstDot);
  const domainPart = rname.substring(firstDot + 1);

  // Basic email format validation
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  const emailFormat = `${localPart}@${domainPart}`;

  if (!emailRegex.test(emailFormat)) {
    return utils.formatWarning(
      "Invalid RNAME format: not a valid email address",
      SEVERITY.ERROR,
    );
  }
};

// Validate serial number is within acceptable range
export const validateSerial: ValidatorFunction = (record: DnsRecord) => {
  const soaData = parseSOAData(record.data);
  if (!soaData)
    return utils.formatWarning("Invalid SOA record format", SEVERITY.ERROR);

  const serial = soaData.serial;

  // Check if serial is within valid range (32-bit unsigned int)
  if (serial < 0 || serial > 4294967295) {
    return utils.formatWarning(
      "SOA serial number must be between 0 and 4294967295",
      SEVERITY.ERROR,
    );
  }
};

// Validate primary nameserver matches NS records
export const validatePrimaryNameserver: ValidatorFunction = (
  record: DnsRecord,
  context: DnsValidationContext,
) => {
  const soaData = parseSOAData(record.data);
  if (!soaData)
    return utils.formatWarning("Invalid SOA record format", SEVERITY.ERROR);

  const nsRecords = context.allRecords?.filter((r) => r.type === "NS") || [];
  if (nsRecords.length === 0)
    return utils.formatWarning(
      "No NS records found to validate against SOA MNAME",
      SEVERITY.ERROR,
    );

  const mname = soaData.mname.toLowerCase();
  const nsNames = nsRecords.map((ns) => ns.data.toLowerCase());

  if (!nsNames.includes(mname)) {
    return utils.formatWarning(
      "SOA MNAME must match one of the NS records",
      SEVERITY.ERROR,
    );
  }
};

// Validate minimum TTL value
export const validateMinimumTTL: ValidatorFunction = (record: DnsRecord) => {
  const soaData = parseSOAData(record.data);
  if (!soaData)
    return utils.formatWarning("Invalid SOA record format", SEVERITY.ERROR);

  // RFC 2308 suggests minimum TTL between 15 minutes to 24 hours
  const minTTL = soaData.minimum;
  if (minTTL < 900) {
    return utils.formatWarning(
      "SOA minimum TTL is less than recommended 15 minutes",
      SEVERITY.WARNING,
    );
  }
  if (minTTL > 86400) {
    return utils.formatWarning(
      "SOA minimum TTL exceeds recommended 24 hours",
      SEVERITY.WARNING,
    );
  }
};

export function validateSOARecord(
  record: DnsRecord,
  context: DnsValidationContext,
): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationWarning[] = [];

  const validators: ValidatorFunction[] = [
    validateRNAME,
    validateSerial,
    validatePrimaryNameserver,
    validateMinimumTTL,
  ];

  for (const validator of validators) {
    const result = validator(record, context);
    if (result) {
      if (result.severity === "error") {
        errors.push(result);
      } else {
        warnings.push(result);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}
