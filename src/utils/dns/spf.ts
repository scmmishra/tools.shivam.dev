import { SEVERITY } from "./constants";
import type {
  DnsRecord,
  DnsValidationContext,
  ValidatorFunction,
  ValidationResult,
  ValidationWarning,
} from "./types";
import { utils } from "./utils";

interface SpfMechanism {
  qualifier: "+" | "-" | "~" | "?";
  type: "all" | "ip4" | "ip6" | "a" | "mx" | "ptr" | "exists" | "include";
  value?: string;
}

interface SpfData {
  version: string;
  mechanisms: SpfMechanism[];
}

const COMMON_INCLUDES = [
  "spf.protection.outlook.com", // Microsoft 365
  "_spf.google.com", // Google Workspace
  "amazonses.com", // Amazon SES
  "spf.mailjet.com", // Mailjet
  "sendgrid.net", // SendGrid
  "msgapp.com", // Campaign Monitor
  "_spf.salesforce.com", // Salesforce
  "servers.mcsv.net", // Mailchimp
  "spf.mandrillapp.com", // Mandrill
  "mail.zendesk.com", // Zendesk
  "postmarkapp.com", // Postmark
  "sparkpostmail.com", // SparkPost
  "mailgun.org", // Mailgun
  "customeriomail.com", // Customer.io
  "exacttarget.com", // Salesforce Marketing Cloud
  "sendpulse.net", // SendPulse
  "sendinblue.com", // Sendinblue
  "freshdesk.com", // Freshdesk
  "helpscout.net", // Help Scout
  "intercom.io", // Intercom
  "zoho.in", // Zoho
  "outbound.sendowl.com", // SendOwl
  "spf.constant.contact.com", // Constant Contact
  "spf.hubspotemail.net", // HubSpot
  "spf.smtp2go.com", // SMTP2GO
  "spf.messagingengine.com", // Fastmail
  "spf.moosend.com", // Moosend
  "sp.frontapp.com", // Front
  "spf.activecampaign.com", // ActiveCampaign
  "mailsender.kayako.com", // Kayako
  "spf.shopify.com", // Shopify
  "spf.drift.com", // Drift
  "spf.convertkit.com", // ConvertKit
  "spf.klaviyo.com", // Klaviyo
  "spf.drip.com", // Drip
  "spf.returnpath.net", // Return Path
  "_spf.protonmail.ch", // ProtonMail
  "spf.socketlabs.com", // SocketLabs
  "spf.mailerlite.com", // MailerLite
  "spf.uservoice.com", // UserVoice
];

function parseSpfRecord(data: string): SpfData | null {
  const parts = data.trim().split(/\s+/);
  if (!parts[0] || !parts[0].startsWith("v=spf")) return null;

  const mechanisms: SpfMechanism[] = [];
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    let qualifier: "+" | "-" | "~" | "?" = "+";
    let mechType: string;
    let value: string | undefined;

    if (["+", "-", "~", "?"].includes(part[0])) {
      qualifier = part[0] as "+" | "-" | "~" | "?";
      mechType = part.slice(1);
    } else {
      mechType = part;
    }

    const colonIndex = mechType.indexOf(":");
    if (colonIndex !== -1) {
      value = mechType.slice(colonIndex + 1);
      mechType = mechType.slice(0, colonIndex);
    }

    if (
      ["all", "ip4", "ip6", "a", "mx", "ptr", "exists", "include"].includes(
        mechType,
      )
    ) {
      mechanisms.push({
        qualifier,
        type: mechType as SpfMechanism["type"],
        value,
      });
    }
  }

  return {
    version: parts[0],
    mechanisms,
  };
}

// Validate basic SPF syntax
export const validateSpfSyntax: ValidatorFunction = (record: DnsRecord) => {
  const data = parseSpfRecord(record.data);
  if (!data) {
    return utils.formatWarning("Invalid SPF record format", SEVERITY.ERROR);
  }

  if (data.version !== "v=spf1") {
    return utils.formatWarning("SPF version must be 'v=spf1'", SEVERITY.ERROR);
  }

  // Check if there's an "all" mechanism at the end
  const lastMech = data.mechanisms[data.mechanisms.length - 1];
  if (!lastMech || lastMech.type !== "all") {
    return utils.formatWarning(
      "SPF record should end with an 'all' mechanism",
      SEVERITY.WARNING,
    );
  }
};

// Check for multiple SPF records
export const validateMultipleSpf: ValidatorFunction = (
  _record: DnsRecord,
  context: DnsValidationContext,
) => {
  const spfRecords = context.allRecords?.filter(
    (r) => r.type === "TXT" && r.data.startsWith("v=spf1"),
  );

  if (spfRecords && spfRecords.length > 1) {
    return utils.formatWarning(
      "Multiple SPF records found - this may cause issues with email delivery",
      SEVERITY.ERROR,
    );
  }
};

// Validate IP ranges and mechanisms
export const validateIpMechanisms: ValidatorFunction = (record: DnsRecord) => {
  const data = parseSpfRecord(record.data);
  if (!data) return;

  for (const mech of data.mechanisms) {
    if (mech.type === "ip4" && mech.value) {
      if (!utils.isValidCIDR(mech.value) && !utils.isValidIPv4(mech.value)) {
        return utils.formatWarning(
          `Invalid IPv4 address or CIDR in SPF record: ${mech.value}`,
          SEVERITY.ERROR,
        );
      }
    }
    if (mech.type === "ip6" && mech.value) {
      if (!utils.isValidCIDR(mech.value) && !utils.isValidIPv6(mech.value)) {
        return utils.formatWarning(
          `Invalid IPv6 address or CIDR in SPF record: ${mech.value}`,
          SEVERITY.ERROR,
        );
      }
    }
  }
};

// Check for recommended provider includes
export const validateCommonIncludes: ValidatorFunction = (
  record: DnsRecord,
) => {
  const data = parseSpfRecord(record.data);
  if (!data) return;

  const includes = data.mechanisms
    .filter((m) => m.type === "include")
    .map((m) => m.value);

  const foundProviders = COMMON_INCLUDES.filter((provider) =>
    includes.some((include) => include?.includes(provider)),
  );

  if (foundProviders.length === 0) {
    return utils.formatWarning(
      "No common email provider includes found in SPF record",
      SEVERITY.INFO,
    );
  }
};

// Check for use of deprecated PTR mechanism
export const validatePtrUsage: ValidatorFunction = (record: DnsRecord) => {
  const data = parseSpfRecord(record.data);
  if (!data) return;

  if (data.mechanisms.some((m) => m.type === "ptr")) {
    return utils.formatWarning(
      "PTR mechanism is deprecated and not recommended for use in SPF records",
      SEVERITY.WARNING,
    );
  }
};

// Validate record length (DNS lookup limit)
export const validateLookupLimit: ValidatorFunction = (record: DnsRecord) => {
  const data = parseSpfRecord(record.data);
  if (!data) return;

  let lookupCount = 0;
  for (const mech of data.mechanisms) {
    switch (mech.type) {
      case "mx":
      case "a":
      case "include":
        lookupCount++;
        break;
      case "exists":
        lookupCount++;
        break;
      case "ptr":
        lookupCount += 2; // PTR is especially lookup-intensive
        break;
    }
  }

  if (lookupCount > 10) {
    return utils.formatWarning(
      `SPF record exceeds 10 DNS lookup limit (found ${lookupCount})`,
      SEVERITY.ERROR,
    );
  }
};

export function validateSpfRecord(
  record: DnsRecord,
  context: DnsValidationContext,
): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationWarning[] = [];

  const validators: ValidatorFunction[] = [
    validateSpfSyntax,
    validateMultipleSpf,
    validateIpMechanisms,
    validateCommonIncludes,
    validatePtrUsage,
    validateLookupLimit,
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
