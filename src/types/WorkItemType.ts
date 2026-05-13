export type WorkItemType =
  | 'slack'
  | 'email'
  | 'calendar'
  | 'client'
  | 'p0'
  | 'sync'
  | 'per-my-last';

export type PriorityTier = 'low' | 'medium' | 'high' | 'critical' | 'trap';

export type ResolutionAction = 'handle' | 'delegate' | 'ignore' | 'block-time';

export interface WorkItemData {
  id: string;
  type: WorkItemType;
  priorityTier: PriorityTier;
  label: string;
  subtext: string;
  energyCost: number;
  timeWindow: number;
  isFalseUrgency: boolean;
  spawnedAt: number;
  cascadeTrigger?: WorkItemType;
  nudgeResolvable: boolean;
}

export interface ResolvedItemRecord {
  item: WorkItemData;
  action: ResolutionAction;
  resolvedAt: number;
}
