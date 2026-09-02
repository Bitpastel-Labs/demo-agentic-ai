export type DomainKey = "inventory" | "marketing" | "operations" | "finance";

export interface Domain {
  key: DomainKey;
  label: string;
  color: string;
}

export const DOMAINS: Domain[] = [
  { key: "inventory", label: "Inventory", color: "#0f766e" },
  { key: "marketing", label: "Marketing", color: "#7c3aed" },
  { key: "operations", label: "Operations", color: "#b54708" },
  { key: "finance", label: "Finance", color: "#067647" },
];

export const domainColor = Object.fromEntries(
  DOMAINS.map((d) => [d.key, d.color]),
) as Record<DomainKey, string>;
