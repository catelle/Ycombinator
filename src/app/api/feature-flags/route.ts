import { NextResponse } from 'next/server';
import { getFeatureFlag } from '@/lib/featureFlags';

export async function GET() {
  const mentorshipMatching = await getFeatureFlag('mentorship_matching');
  const accountabilityPartners = await getFeatureFlag('accountability_partners');

  return NextResponse.json({
    mentorshipMatching,
    accountabilityPartners
  });
}
