import type { CommitmentLevel, Profile, ProfileRole } from '@/types';

const ROLE_COMPLEMENTS: Record<ProfileRole, ProfileRole[]> = {
  technical: ['business', 'product', 'marketing', 'operations'],
  business: ['technical', 'product', 'operations'],
  product: ['technical', 'business', 'design'],
  design: ['product', 'technical', 'marketing'],
  marketing: ['business', 'product', 'technical'],
  operations: ['business', 'technical', 'product'],
  other: ['technical', 'business', 'product']
};

const COMMITMENT_SCORE: Record<CommitmentLevel, number> = {
  exploring: 1,
  weekends: 2,
  'part-time': 3,
  'full-time': 4
};

export interface MatchScore {
  total: number;
  breakdown: {
    role: number;
    skills: number;
    commitment: number;
    location: number;
  };
  reasons: string[];
}

export function calculateCompatibility(profile: Profile, candidate: Profile): MatchScore {
  const reasons: string[] = [];

  const roleMatch = ROLE_COMPLEMENTS[profile.role]?.includes(candidate.role);
  const roleScore = roleMatch ? 30 : profile.role === candidate.role ? 10 : 20;
  reasons.push(roleMatch ? 'Complementary roles' : 'Role alignment');

  const profileSkills = new Set(profile.skills.map(skill => skill.trim().toLowerCase()).filter(Boolean));
  const candidateSkills = new Set(candidate.skills.map(skill => skill.trim().toLowerCase()).filter(Boolean));
  let overlap = 0;
  profileSkills.forEach(skill => {
    if (candidateSkills.has(skill)) overlap += 1;
  });
  const maxSkills = Math.max(1, Math.min(profileSkills.size, candidateSkills.size));
  const skillsScore = Math.round((overlap / maxSkills) * 30);
  if (overlap > 0) {
    reasons.push(`${overlap} shared skill${overlap > 1 ? 's' : ''}`);
  }

  const commitmentDiff = Math.abs(COMMITMENT_SCORE[profile.commitment] - COMMITMENT_SCORE[candidate.commitment]);
  const commitmentScore = Math.max(0, 20 - commitmentDiff * 5);
  reasons.push(commitmentDiff === 0 ? 'Same commitment level' : 'Compatible commitment');

  const normalizedProfileLocation = profile.location.trim().toLowerCase();
  const normalizedCandidateLocation = candidate.location.trim().toLowerCase();
  let locationScore = 0;
  if (normalizedProfileLocation && normalizedCandidateLocation) {
    if (normalizedProfileLocation === normalizedCandidateLocation) {
      locationScore = 20;
      reasons.push('Same location');
    } else if (
      normalizedProfileLocation.includes(normalizedCandidateLocation) ||
      normalizedCandidateLocation.includes(normalizedProfileLocation)
    ) {
      locationScore = 10;
      reasons.push('Nearby location');
    } else if (normalizedProfileLocation.includes('remote') || normalizedCandidateLocation.includes('remote')) {
      locationScore = 10;
      reasons.push('Remote-friendly');
    }
  }

  const total = Math.min(100, roleScore + skillsScore + commitmentScore + locationScore);

  return {
    total,
    breakdown: {
      role: roleScore,
      skills: skillsScore,
      commitment: commitmentScore,
      location: locationScore
    },
    reasons
  };
}

export function getPublicProfile(profile: Profile): Profile {
  return {
    ...profile,
    name: 'Anonymous Founder',
    alias: undefined,
    contactEmail: undefined,
    contactPhone: undefined,
    photoUrl: undefined,
    location: 'Location hidden'
  };
}
