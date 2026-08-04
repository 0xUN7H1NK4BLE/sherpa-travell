import type { ItineraryDay } from "@/data/treks";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatAltitude(meters: number) {
  return `${meters.toLocaleString("en-US")} m`;
}

export function formatCoordinates([lat, lng]: [number, number]) {
  return `${lat.toFixed(2)}° N · ${lng.toFixed(2)}° E`;
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export function toRoman(n: number) {
  return ROMAN[n - 1] ?? String(n);
}

export function oxygenAt(altitudeM: number) {
  const ratio = Math.pow(1 - 2.25577e-5 * altitudeM, 5.25588);
  return Math.max(0, Math.min(100, ratio * 100));
}

export function dayGain(itinerary: ItineraryDay[], index: number) {
  if (index === 0) return null;
  const gain = itinerary[index].altitudeM - itinerary[index - 1].altitudeM;
  return gain > 0 ? gain : null;
}

export function totalAscent(itinerary: ItineraryDay[]) {
  let sum = 0;
  for (let i = 1; i < itinerary.length; i++) {
    const gain = itinerary[i].altitudeM - itinerary[i - 1].altitudeM;
    if (gain > 0) sum += gain;
  }
  return sum;
}
