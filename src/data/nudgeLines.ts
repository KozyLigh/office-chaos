export const BURNOUT_LINES = [
  'Your inbox has {unread} unread. The day is technically still happening.',
  'You handled {handled} items. The backlog won anyway.',
  'Decision fatigue is real. You proved it.',
  '"Busy" and "productive" are not the same word.',
  'Nudge would have routed the noise before this happened.',
  'The P0 could wait. It turns out, you could not.',
];

export const WIN_LINES = [
  'You survived. Most do not get to say that.',
  'Focus: {focus}×. Energy: {energy}%. The math checks out.',
  '{handled} items handled. {nudge} auto-routed by Nudge.',
  'Same inbox tomorrow. At least you know how to fight back.',
  'Nudge automates the decisions that drained you today.',
];

export function formatLine(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    String(vars[key] ?? `{${key}}`)
  );
}
