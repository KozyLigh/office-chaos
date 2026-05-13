import type { WorkItemType, PriorityTier } from '../types/WorkItemType';

export interface WorkItemTemplate {
  type: WorkItemType;
  priorityTier: PriorityTier;
  label: string;
  subtext: string;
  energyCost: number;
  timeWindow: number;
  isFalseUrgency: boolean;
  cascadeTrigger?: WorkItemType;
  nudgeResolvable: boolean;
}

export const WORK_ITEM_TEMPLATES: WorkItemTemplate[] = [
  // Slack pings
  {
    type: 'slack',
    priorityTier: 'low',
    label: 'Slack: "Quick question"',
    subtext: 'It is never quick.',
    energyCost: 2,
    timeWindow: 30,
    isFalseUrgency: false,
    nudgeResolvable: true,
  },
  {
    type: 'slack',
    priorityTier: 'low',
    label: 'Slack: "@here anyone free??"',
    subtext: 'Channel ping. Not urgent.',
    energyCost: 2,
    timeWindow: 30,
    isFalseUrgency: true,
    nudgeResolvable: true,
  },
  {
    type: 'slack',
    priorityTier: 'low',
    label: 'Slack: "👋"',
    subtext: 'No context provided.',
    energyCost: 2,
    timeWindow: 30,
    isFalseUrgency: false,
    nudgeResolvable: true,
  },
  // Emails
  {
    type: 'email',
    priorityTier: 'medium',
    label: 'Reply All Chain (12 replies)',
    subtext: 'Nobody read the thread.',
    energyCost: 5,
    timeWindow: 60,
    isFalseUrgency: false,
    nudgeResolvable: true,
  },
  {
    type: 'email',
    priorityTier: 'medium',
    label: 'Email: "URGENT: Action Required"',
    subtext: 'Newsletter in disguise.',
    energyCost: 5,
    timeWindow: 60,
    isFalseUrgency: true,
    nudgeResolvable: true,
  },
  {
    type: 'email',
    priorityTier: 'medium',
    label: 'Email: "Circling back..."',
    subtext: '5th follow-up this week.',
    energyCost: 5,
    timeWindow: 60,
    isFalseUrgency: false,
    cascadeTrigger: 'slack',
    nudgeResolvable: false,
  },
  // Calendar invites
  {
    type: 'calendar',
    priorityTier: 'medium',
    label: 'Meeting: "Quick Alignment"',
    subtext: 'No agenda. 30 min.',
    energyCost: 3,
    timeWindow: 20,
    isFalseUrgency: false,
    nudgeResolvable: true,
  },
  {
    type: 'calendar',
    priorityTier: 'medium',
    label: 'Calendar: Daily Standup',
    subtext: 'Every day. Same questions.',
    energyCost: 3,
    timeWindow: 20,
    isFalseUrgency: false,
    nudgeResolvable: false,
  },
  // Client requests
  {
    type: 'client',
    priorityTier: 'high',
    label: '⚠ Client: URGENT Request',
    subtext: 'Timeline unclear. Impact: real.',
    energyCost: 10,
    timeWindow: 15,
    isFalseUrgency: false,
    nudgeResolvable: false,
  },
  {
    type: 'client',
    priorityTier: 'high',
    label: '⚠ Client: "Can we hop on a call?"',
    subtext: 'Marked URGENT. Probably fine.',
    energyCost: 10,
    timeWindow: 15,
    isFalseUrgency: true,
    nudgeResolvable: false,
  },
  // P0 tickets
  {
    type: 'p0',
    priorityTier: 'critical',
    label: '🚨 P0: Auth Service Down',
    subtext: 'Users cannot log in. Now.',
    energyCost: 15,
    timeWindow: 10,
    isFalseUrgency: false,
    cascadeTrigger: 'calendar',
    nudgeResolvable: false,
  },
  {
    type: 'p0',
    priorityTier: 'critical',
    label: '🚨 P0: Prod DB at 99% disk',
    subtext: '1 hour before full. Handle immediately.',
    energyCost: 15,
    timeWindow: 10,
    isFalseUrgency: false,
    nudgeResolvable: false,
  },
  // Quick syncs (trap)
  {
    type: 'sync',
    priorityTier: 'trap',
    label: '"Quick Sync" (30 min)',
    subtext: 'Could be an email.',
    energyCost: 8,
    timeWindow: 20,
    isFalseUrgency: true,
    nudgeResolvable: true,
  },
  {
    type: 'sync',
    priorityTier: 'trap',
    label: '"Let me grab 5 min of your time"',
    subtext: 'Nobody has ever taken 5 min.',
    energyCost: 8,
    timeWindow: 20,
    isFalseUrgency: true,
    nudgeResolvable: true,
  },
  // Per My Last Email (trap)
  {
    type: 'per-my-last',
    priorityTier: 'trap',
    label: '"Per My Last Email..."',
    subtext: 'Read the chain first.',
    energyCost: 3,
    timeWindow: 45,
    isFalseUrgency: false,
    nudgeResolvable: false,
  },
  {
    type: 'per-my-last',
    priorityTier: 'trap',
    label: '"As I mentioned previously..."',
    subtext: 'They mentioned it once, briefly.',
    energyCost: 3,
    timeWindow: 45,
    isFalseUrgency: true,
    nudgeResolvable: false,
  },
];
