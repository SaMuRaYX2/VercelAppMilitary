// "Новий" = browser first seen at essentially the same time this survey started;
// "Повторний" = the visitor cookie predates the survey, so they'd been here before.
// ponytail: 10-min slack absorbs the gap between landing and reaching the survey;
// widen it if sign-up ever takes longer.
const SLACK_MS = 10 * 60 * 1000;

export function visitorLabel(firstSeen: Date | null, started: Date): "Новий" | "Повторний" | null {
  if (!firstSeen) return null;
  return firstSeen.getTime() < started.getTime() - SLACK_MS ? "Повторний" : "Новий";
}
