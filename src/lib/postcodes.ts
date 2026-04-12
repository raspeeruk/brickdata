/** Postcode formatting and URL slug utilities */

/** Format a raw postcode into standard form: "SW1A 2AA" */
export function formatPostcode(raw: string): string {
  const clean = raw.replace(/\s/g, "").toUpperCase();
  if (clean.length < 4) return clean;
  return `${clean.slice(0, -3)} ${clean.slice(-3)}`;
}

/** Convert postcode to URL slug: "SW1A 2AA" -> "sw1a-2aa" */
export function postcodeToSlug(postcode: string): string {
  return postcode.replace(/\s/g, "").toLowerCase();
  // No hyphen — just lowercase, no spaces: "sw1a2aa"
}

/** Convert URL slug back to postcode: "sw1a2aa" -> "SW1A 2AA" */
export function slugToPostcode(slug: string): string {
  return formatPostcode(slug);
}

/** Convert street name to URL slug: "PETERSHAM ROAD" -> "petersham-road" */
export function streetToSlug(street: string): string {
  return street
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Convert URL slug back to street name: "petersham-road" -> "Petersham Road" */
export function slugToStreet(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Convert house number to URL slug: "132B" -> "132b" */
export function numberToSlug(num: string): string {
  return num.toLowerCase().replace(/\s/g, "-");
}

/** Convert slug back to house number: "132b" -> "132B" */
export function slugToNumber(slug: string): string {
  return slug.toUpperCase().replace(/-/g, " ");
}

/** Generate a BrickData reference number */
export function generateRef(
  postcode: string,
  street?: string,
  number?: string
): string {
  const parts = [postcodeToSlug(postcode).toUpperCase()];
  if (street) parts.push(streetToSlug(street).toUpperCase().replace(/-/g, "/"));
  if (number) parts.push(number.toUpperCase());
  return `REF: ${parts.join("/")}`;
}

/** Get postcode district (outward code): "SW1A 2AA" -> "SW1A" */
export function getPostcodeDistrict(postcode: string): string {
  const formatted = formatPostcode(postcode);
  return formatted.split(" ")[0];
}
