import { getCollection } from './db';
import type { FeatureFlag } from '@/types';

interface DbFeatureFlag extends Omit<FeatureFlag, 'id'> {
  _id: string;
}

const DEFAULT_FLAGS: Record<FeatureFlag['key'], boolean> = {
  mentorship_matching: false,
  accountability_partners: false
};

export async function getFeatureFlag(key: FeatureFlag['key']): Promise<boolean> {
  const flags = await getCollection<DbFeatureFlag>('featureFlags');
  const flag = await flags.findOne({ _id: key });
  if (!flag) return DEFAULT_FLAGS[key];
  return flag.enabled;
}
