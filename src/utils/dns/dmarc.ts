import { VALIDATION_MESSAGES, SEVERITY } from "./constants";
import type {
  DnsRecord,
  DnsValidationContext,
  ValidatorFunction,
  ValidationResult,
  ValidationWarning,
} from "./types";
import { utils } from "./utils";

interface DmarcData {
  version: string;
  policy: string;
  subdomainPolicy?: string;
  pct?: number;
  rua?: string[];
  ruf?: string[];
  fo?: string[];
  aspf?: "r" | "s";
  adkim?: "r" | "s";
  ri?: number;
  rf?: string[];
}

function parseDmarcRecord(data: string): DmarcData | null {
  const tags = utils.parseDNSKeyValue(data);
  if (!tags.v || tags.v !== "DMARC1") {
    console.log("RETRUNING NULL", tags);
    return null;
  }

  // Convert RUA/RUF comma-separated lists to arrays
  const rua = tags.rua?.split(",").map((uri) => uri.trim());
  const ruf = tags.ruf?.split(",").map((uri) => uri.trim());
  const fo = tags.fo?.split(":").map((opt) => opt.trim());
  const rf = tags.rf?.split(":").map((type) => type.trim());

  return {
    version: tags.v,
    policy: tags.p,
    subdomainPolicy: tags.sp,
    pct: tags.pct ? parseInt(tags.pct, 10) : undefined,
    rua,
    ruf,
    fo,
    aspf: tags.aspf as "r" | "s",
    adkim: tags.adkim as "r" | "s",
    ri: tags.ri ? parseInt(tags.ri, 10) : undefined,
    rf,
  };
}

// Check if domain has a DMARC record at _dmarc subdomain
export const validateDmarcExists: ValidatorFunction = (
  record: DnsRecord,
  context: DnsValidationContext,
) => {
  const dmarcRecords = record;

  if (!dmarcRecords) {
    return utils.formatWarning(
      "No DMARC record found at _dmarc subdomain",
      SEVERITY.ERROR,
    );
  }
};

// Validate DMARC record structure
export const validateDmarcStructure: ValidatorFunction = (
  record: DnsRecord,
) => {
  const data = parseDmarcRecord(record.data);
  if (!data) {
    return utils.formatWarning("Invalid DMARC record format", SEVERITY.ERROR);
  }

  if (!data.policy) {
    return utils.formatWarning(
      "Missing required policy (p) tag",
      SEVERITY.ERROR,
    );
  }

  if (!["none", "quarantine", "reject"].includes(data.policy)) {
    return utils.formatWarning(
      "Invalid policy value - must be 'none', 'quarantine', or 'reject'",
      SEVERITY.ERROR,
    );
  }
};

// Validate alignment settings
export const validateAlignment: ValidatorFunction = (record: DnsRecord) => {
  const data = parseDmarcRecord(record.data);
  if (!data) return;

  if (data.aspf && !["r", "s"].includes(data.aspf)) {
    return utils.formatWarning(
      "Invalid SPF alignment mode - must be 'r' (relaxed) or 's' (strict)",
      SEVERITY.ERROR,
    );
  }

  if (data.adkim && !["r", "s"].includes(data.adkim)) {
    return utils.formatWarning(
      "Invalid DKIM alignment mode - must be 'r' (relaxed) or 's' (strict)",
      SEVERITY.ERROR,
    );
  }

  if (data.aspf === "s" || data.adkim === "s") {
    return utils.formatWarning(
      "Strict alignment mode may cause legitimate emails to fail",
      SEVERITY.WARNING,
    );
  }
};

// Validate reporting URIs
export const validateReportingURIs: ValidatorFunction = (record: DnsRecord) => {
  const data = parseDmarcRecord(record.data);
  if (!data) return;

  // Validate aggregate report URIs
  if (data.rua) {
    if (data.rua.length > 2) {
      return utils.formatWarning(
        "Too many aggregate report URIs (maximum 2 recommended)",
        SEVERITY.WARNING,
      );
    }

    for (const uri of data.rua) {
      const parsedUri = utils.parseURI(uri);
      if (
        !parsedUri ||
        (parsedUri.scheme !== "mailto" && parsedUri.scheme !== "https")
      ) {
        return utils.formatWarning(
          `Invalid aggregate report URI format: ${uri}`,
          SEVERITY.ERROR,
        );
      }
    }
  }

  // Validate forensic report URIs
  if (data.ruf) {
    for (const uri of data.ruf) {
      const parsedUri = utils.parseURI(uri);
      if (!parsedUri || parsedUri.scheme !== "mailto") {
        return utils.formatWarning(
          `Forensic report URI must use mailto scheme: ${uri}`,
          SEVERITY.ERROR,
        );
      }
    }
  }

  // Recommend having both types of reporting
  if (!data.rua || !data.ruf) {
    return utils.formatWarning(
      "Consider enabling both aggregate (rua) and forensic (ruf) reporting",
      SEVERITY.INFO,
    );
  }
};

// Validate policy settings
export const validatePolicySettings: ValidatorFunction = (
  record: DnsRecord,
) => {
  const data = parseDmarcRecord(record.data);
  if (!data) return;

  // Check percentage
  if (data.pct !== undefined) {
    if (data.pct < 0 || data.pct > 100) {
      return utils.formatWarning(
        "Invalid percentage - must be between 0 and 100",
        SEVERITY.ERROR,
      );
    }
    if (data.pct < 100) {
      return utils.formatWarning(
        `Only ${data.pct}% of messages are subject to filtering`,
        SEVERITY.WARNING,
      );
    }
  }

  // Check subdomain policy
  if (
    data.subdomainPolicy &&
    !["none", "quarantine", "reject"].includes(data.subdomainPolicy)
  ) {
    return utils.formatWarning(
      "Invalid subdomain policy - must be 'none', 'quarantine', or 'reject'",
      SEVERITY.ERROR,
    );
  }

  // Check report interval
  if (data.ri !== undefined) {
    if (data.ri < 3600 || data.ri > 86400) {
      return utils.formatWarning(
        "Report interval should be between 1 hour and 24 hours",
        SEVERITY.WARNING,
      );
    }
  }

  // Progressive policy recommendation
  if (data.policy === "none") {
    return utils.formatWarning(
      "Consider moving to a stricter policy ('quarantine' or 'reject') once email authentication is stable",
      SEVERITY.INFO,
    );
  }
};

export function validateDmarcRecord(
  record: DnsRecord,
  context: DnsValidationContext,
): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationWarning[] = [];

  const validators: ValidatorFunction[] = [
    validateDmarcExists,
    validateDmarcStructure,
    validateAlignment,
    validateReportingURIs,
    validatePolicySettings,
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
