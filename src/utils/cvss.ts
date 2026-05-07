export const AV_VALUES: Record<string, number> = {
  N: 0.85,
  A: 0.62,
  L: 0.55,
  P: 0.20,
};
export const AC_VALUES: Record<string, number> = { L: 0.77, H: 0.44 };
export const PR_VALUES: Record<string, { U: number; C: number }> = {
  N: { U: 0.85, C: 0.85 },
  L: { U: 0.62, C: 0.68 },
  H: { U: 0.27, C: 0.50 },
};
export const UI_VALUES: Record<string, number> = { N: 0.85, R: 0.62 };
export const CIA_VALUES: Record<string, number> = { N: 0.0, L: 0.22, H: 0.56 };

export type Metric = "AV" | "AC" | "PR" | "UI" | "S" | "C" | "I" | "A";

export interface ParsedCvss {
  version: string;
  AV: string;
  AC: string;
  PR: string;
  UI: string;
  S: string;
  C: string;
  I: string;
  A: string;
}

export type ParseResult =
  | { ok: true; parsed: ParsedCvss }
  | { ok: false; error: string };

export const REQUIRED_METRICS: Metric[] = [
  "AV",
  "AC",
  "PR",
  "UI",
  "S",
  "C",
  "I",
  "A",
];

export const METRIC_FULL_NAME: Record<Metric, string> = {
  AV: "Attack Vector",
  AC: "Attack Complexity",
  PR: "Privileges Required",
  UI: "User Interaction",
  S: "Scope",
  C: "Confidentiality",
  I: "Integrity",
  A: "Availability",
};

export const METRIC_VALUE_LABEL: Record<Metric, Record<string, string>> = {
  AV: { N: "Network", A: "Adjacent", L: "Local", P: "Physical" },
  AC: { L: "Low", H: "High" },
  PR: { N: "None", L: "Low", H: "High" },
  UI: { N: "None", R: "Required" },
  S: { U: "Unchanged", C: "Changed" },
  C: { N: "None", L: "Low", H: "High" },
  I: { N: "None", L: "Low", H: "High" },
  A: { N: "None", L: "Low", H: "High" },
};

export const METRIC_OPTIONS: Record<Metric, string[]> = {
  AV: ["N", "A", "L", "P"],
  AC: ["L", "H"],
  PR: ["N", "L", "H"],
  UI: ["N", "R"],
  S: ["U", "C"],
  C: ["H", "L", "N"],
  I: ["H", "L", "N"],
  A: ["H", "L", "N"],
};

export const METRIC_DESCRIPTION: Record<Metric, string> = {
  AV: "How the attacker reaches the vulnerable component.",
  AC: "How hard exploitation is — favorable conditions or specialized knowledge needed.",
  PR: "Level of access the attacker must already have.",
  UI: "Whether a human action is required for the attack to succeed.",
  S: "Whether the impact stays within the component's security authority.",
  C: "Loss of data privacy if the vulnerability is exploited.",
  I: "Potential for unauthorized modification or corruption.",
  A: "Disruption to system operations or service availability.",
};

export const METRIC_VALUE_DESCRIPTION: Record<Metric, Record<string, string>> =
  {
    AV: {
      N: "Exploitable over a network with no direct access required.",
      A: "Requires same physical or logical network segment (LAN, VPN, MPLS).",
      L: "Requires local access to the component, or it processes malicious content delivered to it.",
      P: "Requires direct physical interaction with the hardware.",
    },
    AC: {
      L: "Straightforward — no specialized knowledge or special conditions.",
      H: "Specific configuration or timing constraints make exploitation substantially harder.",
    },
    PR: {
      N: "No authentication or pre-existing privileges needed.",
      L: "Basic user-level access required.",
      H: "Administrator or equivalent elevated privileges required.",
    },
    UI: {
      N: "Exploitable without any user action.",
      R: "Requires a victim to take a deliberate action (click a link, open a file).",
    },
    S: {
      U: "Impact is contained within the vulnerable component's security authority.",
      C: "Impact crosses a security boundary into another component or authority.",
    },
    C: {
      N: "No loss of confidentiality.",
      L: "Some sensitive data may be disclosed, but limited in scope.",
      H: "Complete disclosure of sensitive information.",
    },
    I: {
      N: "No data modification possible.",
      L: "Limited modification of some data.",
      H: "Complete compromise — attacker can modify or delete substantial data.",
    },
    A: {
      N: "No disruption to availability.",
      L: "Reduced performance or partial service interruption.",
      H: "Total loss of service or availability.",
    },
  };

export type Tier = "none" | "low" | "medium" | "high" | "critical";

export const TIER_LABEL: Record<Tier, string> = {
  none: "None",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export function parseCvss(vec: string): ParseResult {
  const trimmed = vec.trim();
  if (!trimmed) return { ok: false, error: "Enter a CVSS vector to begin." };

  const parts = trimmed.split("/");
  const head = parts[0];
  const versionMatch = head.match(/^CVSS:(3\.0|3\.1)$/);
  if (!versionMatch) {
    if (head.startsWith("CVSS:4")) {
      return {
        ok: false,
        error: "CVSS 4.0 not supported yet. Use a 3.0 or 3.1 vector.",
      };
    }
    return { ok: false, error: "Vector must start with CVSS:3.0 or CVSS:3.1." };
  }

  const map: Record<string, string> = {};
  for (const seg of parts.slice(1)) {
    const [k, v] = seg.split(":");
    if (!k || !v) return { ok: false, error: `Invalid segment: "${seg}".` };
    map[k] = v;
  }

  for (const m of REQUIRED_METRICS) {
    if (!(m in map)) return { ok: false, error: `Missing metric: ${m}.` };
  }

  if (!(map.AV in AV_VALUES)) return { ok: false, error: `Invalid AV value: ${map.AV}.` };
  if (!(map.AC in AC_VALUES)) return { ok: false, error: `Invalid AC value: ${map.AC}.` };
  if (!(map.PR in PR_VALUES)) return { ok: false, error: `Invalid PR value: ${map.PR}.` };
  if (!(map.UI in UI_VALUES)) return { ok: false, error: `Invalid UI value: ${map.UI}.` };
  if (map.S !== "U" && map.S !== "C") return { ok: false, error: `Invalid S value: ${map.S}.` };
  if (!(map.C in CIA_VALUES)) return { ok: false, error: `Invalid C value: ${map.C}.` };
  if (!(map.I in CIA_VALUES)) return { ok: false, error: `Invalid I value: ${map.I}.` };
  if (!(map.A in CIA_VALUES)) return { ok: false, error: `Invalid A value: ${map.A}.` };

  return {
    ok: true,
    parsed: {
      version: versionMatch[1],
      AV: map.AV,
      AC: map.AC,
      PR: map.PR,
      UI: map.UI,
      S: map.S,
      C: map.C,
      I: map.I,
      A: map.A,
    },
  };
}

export function buildVector(p: ParsedCvss): string {
  return `CVSS:${p.version}/AV:${p.AV}/AC:${p.AC}/PR:${p.PR}/UI:${p.UI}/S:${p.S}/C:${p.C}/I:${p.I}/A:${p.A}`;
}

export function cvssRoundUp(input: number): number {
  const intInput = Math.round(input * 100000);
  if (intInput % 10000 === 0) return intInput / 100000;
  return (Math.floor(intInput / 10000) + 1) / 10;
}

export function computeBaseScore(p: ParsedCvss): number {
  const av = AV_VALUES[p.AV];
  const ac = AC_VALUES[p.AC];
  const pr = PR_VALUES[p.PR][p.S as "U" | "C"];
  const ui = UI_VALUES[p.UI];
  const c = CIA_VALUES[p.C];
  const i = CIA_VALUES[p.I];
  const a = CIA_VALUES[p.A];

  const iss = 1 - (1 - c) * (1 - i) * (1 - a);
  const impact =
    p.S === "U"
      ? 6.42 * iss
      : 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);

  const exploitability = 8.22 * av * ac * pr * ui;

  if (impact <= 0) return 0;

  const raw =
    p.S === "U"
      ? Math.min(impact + exploitability, 10)
      : Math.min(1.08 * (impact + exploitability), 10);

  return cvssRoundUp(raw);
}

export function severityTier(score: number): Tier {
  if (score === 0) return "none";
  if (score < 4.0) return "low";
  if (score < 7.0) return "medium";
  if (score < 9.0) return "high";
  return "critical";
}
