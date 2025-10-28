import { AbilityProfile, ABILITY_PROFILES } from '@/types/abilities';
import { Badge } from '@/components/ui/badge';

interface ModeChipProps {
  profile: AbilityProfile;
}

export const ModeChip = ({ profile }: ModeChipProps) => {
  const info = ABILITY_PROFILES[profile];
  
  return (
    <Badge 
      variant="secondary" 
      className="text-sm font-semibold px-3 py-1"
      aria-label={`Current mode: ${info.label}`}
    >
      {info.label}
    </Badge>
  );
};
