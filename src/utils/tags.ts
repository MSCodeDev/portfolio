import labels from "@/data/tags.json";

/** Display name for a project tag slug (shared with the resume builder via src/data/tags.json). */
export function tagLabel(tag: string): string {
  return (labels as Record<string, string>)[tag] ?? tag.charAt(0).toUpperCase() + tag.slice(1);
}

/** Colour classes for a project's status pill. */
export function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("dep")) return "border-blue-500/50 bg-blue-500/10 text-blue-400";
  if (s.includes("arch")) return "border-yellow-500/50 bg-yellow-500/10 text-yellow-400";
  if (s.includes("contri")) return "border-orange-500/50 bg-orange-500/10 text-orange-400";
  return "border-green-500/50 bg-green-500/10 text-green-400";
}
