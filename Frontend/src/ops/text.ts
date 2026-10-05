/** Replaces {pipeline} / {country} placeholders in the failure-type templates. */
export function fill(text: string, ctx: { pipeline: string; country: string }): string {
  return text.replaceAll("{pipeline}", ctx.pipeline).replaceAll("{country}", ctx.country);
}

export function title(snake: string): string {
  return snake
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
