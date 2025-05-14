import { VALIDATION_MESSAGES, SEVERITY } from "./constants";
import type {
  DnsRecord,
  DnsValidationContext,
  ValidatorFunction,
  ValidationResult,
  ValidationWarning,
} from "./types";
import { utils } from "./utils";

interface CNAMEData {
  target: string;
}

function parseCNAMERecord(data: string): CNAMEData | null {
  const target = data.trim().toLowerCase();
  if (!target || !utils.isValidDomain(target)) return null;

  return { target };
}

/**
 * Validates that CNAME records are not present at the apex (root) domain
 */
export const validateApexCNAME: ValidatorFunction = (
  record: DnsRecord,
  context: DnsValidationContext,
) => {
  // Remove trailing dot if present for comparison
  const recordName = utils.normalizeDomain(record.name);
  const domainName = utils.normalizeDomain(context.domain);

  if (recordName === domainName) {
    return utils.formatWarning(
      VALIDATION_MESSAGES.CNAME.APEX_RECORD,
      SEVERITY.ERROR,
    );
  }
};

/**
 * Validates that CNAME records don't coexist with other records for the same name
 * RFC 1034 states that if a CNAME is present, no other data should be present
 */
export const validateCNAMECoexistence: ValidatorFunction = (
  record: DnsRecord,
  context: DnsValidationContext,
) => {
  const otherRecords =
    context.allRecords?.filter(
      (r) =>
        r.name === record.name &&
        r.type !== "CNAME" &&
        // Skip some record types that can coexist
        !["RRSIG", "NSEC", "NSEC3", "DNSKEY"].includes(r.type),
    ) || [];

  if (otherRecords.length > 0) {
    // const conflictingTypes = [...new Set(otherRecords.map((r) => r.type))].join(
    //   ", ",
    // );
    return utils.formatWarning(
      VALIDATION_MESSAGES.CNAME.COEXISTENCE,
      SEVERITY.ERROR,
    );
  }
};

/**
 * Validates CNAME record format
 */
export const validateCNAMEFormat: ValidatorFunction = (record: DnsRecord) => {
  const data = parseCNAMERecord(record.data);
  if (!data) {
    return utils.formatWarning(
      "Invalid CNAME record format - target must be a valid domain name",
      SEVERITY.ERROR,
    );
  }

  if (data.target === record.name) {
    return utils.formatWarning(
      "CNAME target cannot point to itself",
      SEVERITY.ERROR,
    );
  }
};

/**
 * Validates a single CNAME record
 */
export function validateCNAMERecord(
  record: DnsRecord,
  context: DnsValidationContext,
): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationWarning[] = [];

  const validators: ValidatorFunction[] = [
    validateCNAMEFormat,
    validateApexCNAME,
    validateCNAMECoexistence,
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

/**
 * Validates a set of CNAME records
 */
export function validateCNAMERecords(
  records: DnsRecord[],
  context: DnsValidationContext,
): ValidationResult {
  const results = records.map((record) => validateCNAMERecord(record, context));

  return {
    isValid: results.every((r) => r.isValid),
    warnings: results.flatMap((r) => r.warnings),
    errors: results.flatMap((r) => r.errors),
  };
}
