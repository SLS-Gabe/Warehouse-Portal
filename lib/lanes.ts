// How Q&A issue_types split across the two warehouse lanes.
// Shipping specialists own shipping questions; Items specialists own the rest
// (bundles, photos, general questions about the gear itself, etc.).
//
// NOTE: the API lists issue_types as "e.g. bundles, shipping, photos,
// general_question" — there may be more. Anything not in SHIPPING_ISSUE_TYPES
// falls to the Items lane by default, so new types surface rather than vanish.

export type Lane = "items" | "shipping";

export const SHIPPING_ISSUE_TYPES = ["shipping"];

export function laneForIssueType(issueType: string): Lane {
  return SHIPPING_ISSUE_TYPES.includes(issueType) ? "shipping" : "items";
}

export const LANE_LABELS: Record<Lane, string> = {
  items: "Items",
  shipping: "Shipping",
};
