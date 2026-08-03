export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatAltitude(meters: number) {
  return `${meters.toLocaleString("en-US")} m`;
}
