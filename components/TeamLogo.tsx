'use client';

import Image from 'next/image';
import { getTeamLogoUrl } from '@/lib/teams';

interface TeamLogoProps {
  teamName?: string | null;
  teamId?: string | null;
  size?: number; // Size in pixels
  className?: string;
}

/**
 * TeamLogo component - Displays NBA team logo from CDN
 * Can use either teamName or teamId prop
 */
export default function TeamLogo({ 
  teamName, 
  teamId, 
  size = 24, 
  className = '' 
}: TeamLogoProps) {
  // Prefer teamName over teamId
  const logoUrl = getTeamLogoUrl(teamName || teamId || null);
  
  if (!logoUrl) return null;
  
  return (
    <Image
      src={logoUrl}
      alt={teamName ? `${teamName} logo` : 'Team logo'}
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
      unoptimized // NBA CDN handles optimization
    />
  );
}

