import { VALIDATION_MESSAGES, SEVERITY } from "./constants";
import type {
  DnsRecord,
  DnsValidationContext,
  ValidatorFunction,
  ValidationResult,
  ValidationWarning,
} from "./types";
import { utils } from "./utils";

interface MXData {
  priority: number;
  target: string;
}

function parseMXRecord(data: string): MXData | null {
  const parts = data.trim().split(/\s+/);
  if (parts.length !== 2) return null;

  const priority = parseInt(parts[0], 10);
  if (isNaN(priority)) return null;

  return {
    priority,
    target: parts[1].toLowerCase(),
  };
}

/**
 * Validates MX record priorities are unique
 */
export const validatePriorities: ValidatorFunction = (
  record: DnsRecord,
  context: DnsValidationContext,
) => {
  const mxRecords = context.allRecords?.filter((r) => r.type === "MX") || [];
  if (mxRecords.length <= 1) return;

  const priorities = new Set<number>();
  const mxData = parseMXRecord(record.data);

  if (!mxData) return utils.formatWarning(
    VALIDATION_MESSAGES.MX.NULL_MX_FORMAT,
    SEVERITY.ERROR
  );

  if (priorities.has(mxData.priority)) {
    return utils.formatWarning(
      VALIDATION_MESSAGES.MX.DUPLICATE_PRIORITY,
      SEVERITY.WARNING,
    );
  }

  priorities.add(mxData.priority);
};

/**
 * Validates null MX implementation (RFC 7505)
 */
export const validateNullMX: ValidatorFunction = (record: DnsRecord) => {
  const mxData = parseMXRecord(record.data);
  if (!mxData) return utils.formatWarning(
    VALIDATION_MESSAGES.MX.NULL_MX_FORMAT,
    SEVERITY.ERROR
  );

  // Null MX should have priority 0 and target "."
  if (mxData.priority === 0 && mxData.target !== ".") {
    return utils.formatWarning(
      VALIDATION_MESSAGES.MX.NULL_MX_FORMAT,
      SEVERITY.ERROR,
    );
  }
};

/**
 * Checks for deprecated or insecure MX configurations
 */
export const validateDeprecatedConfigs: ValidatorFunction = (
  record: DnsRecord,
) => {
  const mxData = parseMXRecord(record.data);
  if (!mxData) return utils.formatWarning(
    VALIDATION_MESSAGES.MX.NULL_MX_FORMAT,
    SEVERITY.ERROR
  );

  // Check for IP addresses instead of hostnames
  if (utils.isValidIPv4(mxData.target) || utils.isValidIPv6(mxData.target)) {
    return utils.formatWarning(
      "MX target should be a hostname, not an IP address",
      SEVERITY.ERROR,
    );
  }

  // Check for localhost or internal domains
  if (
    mxData.target === "localhost" ||
    mxData.target.endsWith(".local") ||
    mxData.target.endsWith(".internal") ||
    mxData.target.endsWith(".lan")
  ) {
    return utils.formatWarning(
      "MX target appears to be an internal hostname",
      SEVERITY.WARNING,
    );
  }

  // Check for common misconfigurations
  if (mxData.target === record.name) {
    return utils.formatWarning(
      "MX target should not point to itself",
      SEVERITY.ERROR,
    );
  }
};

/**
 * Validates an MX record
 */
export function validateMXRecord(
  record: DnsRecord,
  context: DnsValidationContext,
): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationWarning[] = [];

  const validators: ValidatorFunction[] = [
    validatePriorities,
    validateNullMX,
    validateDeprecatedConfigs,
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
 * Validates a set of MX records
 */
export function validateMXRecords(
  records: DnsRecord[],
  context: DnsValidationContext,
): ValidationResult {
  const results = records.map((record) => validateMXRecord(record, context));

  return {
    isValid: results.every((r) => r.isValid),
    warnings: results.flatMap((r) => r.warnings),
    errors: results.flatMap((r) => r.errors),
  };
}
