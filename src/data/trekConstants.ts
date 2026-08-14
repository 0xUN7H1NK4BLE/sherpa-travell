import type { Difficulty, DayKind } from "./treks";

export const difficulties: Difficulty[] = ["Moderate", "Challenging", "Strenuous"];

export const dayKindLabel: Record<DayKind, string> = {
  trek: "Trek",
  acclimatization: "Acclimatization",
  travel: "Travel",
  summit: "High point",
};
