import type { Profile } from '@/types';

export function isProfileComplete(profile: Pick<Profile, 'name' | 'role' | 'skills' | 'interests' | 'commitment' | 'location'> & { completed?: boolean }): boolean {
  if (profile.completed === true) return true;
  if (profile.completed === false) return false;

  const hasName = typeof profile.name === 'string' && profile.name.trim().length > 1;
  const hasRole = typeof profile.role === 'string' && profile.role.trim().length > 0;
  const hasSkills = Array.isArray(profile.skills) && profile.skills.length > 0;
  const hasInterests = typeof profile.interests === 'string' && profile.interests.trim().length > 0;
  const hasCommitment = typeof profile.commitment === 'string' && profile.commitment.trim().length > 0;
  const hasLocation = typeof profile.location === 'string' && profile.location.trim().length > 0;

  return hasName && hasRole && hasSkills && hasInterests && hasCommitment && hasLocation;
}
