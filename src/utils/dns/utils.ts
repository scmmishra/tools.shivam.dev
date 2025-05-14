import { SEVERITY } from "./constants";
import type { ValidationWarning, Severity } from "./types";
import { isIPV4Address, isIPV6Address } from "../validate";

export interface URIComponents {
  scheme: string;
  userinfo?: string;
  host: string;
  port?: string;
  path?: string;
  query?: string;
  fragment?: string;
}

export const utils = {
  /**
   * Parse a URI string into its components
   */
  parseURI(uri: string): URIComponents | null {
    try {
      const url = new URL(uri);
      return {
        scheme: url.protocol.slice(0, -1),
        userinfo: url.username
          ? `${url.username}${url.password ? ":" + url.password : ""}`
          : undefined,
        host: url.hostname,
        port: url.port || undefined,
        path: url.pathname || undefined,
        query: url.search.slice(1) || undefined,
        fragment: url.hash.slice(1) || undefined,
      };
    } catch {
      return null;
    }
  },

  /**
   * Validate a domain name
   */
  isValidDomain(domain: string): boolean {
    const pattern =
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return pattern.test(domain);
  },

  /**
   * Validate an IPv4 address
   */
  isValidIPv4(ip: string): boolean {
    return isIPV4Address(ip);
  },

  /**
   * Validate an IPv6 address
   */
  isValidIPv6(ip: string): boolean {
    return isIPV6Address(ip);
  },

  /**
   * Validate an email address
   */
  isValidEmail(email: string): boolean {
    // Basic email validation - for more comprehensive validation consider using a library
    const pattern =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return pattern.test(email);
  },

  /**
   * Format a validation warning with severity
   */
  formatWarning(
    message: string,
    severity: Severity = SEVERITY.WARNING,
  ): ValidationWarning {
    return {
      code: message.toLowerCase().replace(/\s+/g, "_"),
      message,
      severity,
    };
  },

  /**
   * Normalize a domain name by removing trailing dot and converting to lowercase
   */
  normalizeDomain(domain: string): string {
    return domain.replace(/\.$/, "").toLowerCase();
  },

  /**
   * Parse key-value pairs from a DNS record (like SPF or DMARC)
   */
  parseDNSKeyValue(record: string): Record<string, string> {
    const result: Record<string, string> = {};
    const parts = record.split(";");

    for (const part of parts) {
      const [key, value] = part.trim().split("=");
      if (key && value) {
        result[key.trim().toLowerCase()] = value.trim();
      }
    }

    return result;
  },

  /**
   * Check if a string represents a valid port number
   */
  isValidPort(port: string): boolean {
    const num = parseInt(port, 10);
    return !isNaN(num) && num > 0 && num <= 65535;
  },

  /**
   * Convert TTL to a human-readable format
   */
  formatTTL(ttl: number): string {
    const units: [number, string][] = [
      [86400, "day"],
      [3600, "hour"],
      [60, "minute"],
      [1, "second"],
    ];

    for (const [value, unit] of units) {
      if (ttl >= value) {
        const amount = Math.floor(ttl / value);
        return `${amount} ${unit}${amount !== 1 ? "s" : ""}`;
      }
    }

    return `${ttl} seconds`;
  },

  /**
   * Check if a hostname is a wildcard
   */
  isWildcard(hostname: string): boolean {
    return hostname.startsWith("*.");
  },

  /**
   * Validate CIDR notation
   */
  isValidCIDR(cidr: string): boolean {
    const [ip, prefix] = cidr.split("/");
    if (!prefix) return false;

    const prefixNum = parseInt(prefix, 10);
    if (isNaN(prefixNum)) return false;

    if (utils.isValidIPv4(ip)) {
      return prefixNum >= 0 && prefixNum <= 32;
    }
    if (utils.isValidIPv6(ip)) {
      return prefixNum >= 0 && prefixNum <= 128;
    }

    return false;
  },
};
