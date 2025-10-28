import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AbilityProfile, ABILITY_PROFILES } from '@/types/abilities';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

export const Onboarding = () => {
  const navigate = useNavigate();
  const [selectedProfile, setSelectedProfile] = useState<AbilityProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error('Please sign in first');
        navigate('/auth');
      } else {
        setIsLoading(false);
      }
    });
  }, [navigate]);

  const handleComplete = async () => {
    if (!selectedProfile) {
      toast.error('Please select an ability profile');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          ability_profile: {
            profile: selectedProfile,
            prefs: {}
          }
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile set up successfully!');
      navigate('/home');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-foreground">
            Welcome to UNI-COM
          </h1>
          <p className="text-xl text-muted-foreground">
            One AI, Every Voice – Because Communication Has No Limits
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-center">
            Choose Your Communication Profile
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {(Object.keys(ABILITY_PROFILES) as AbilityProfile[]).map(profile => {
              const info = ABILITY_PROFILES[profile];
              const isSelected = selectedProfile === profile;
              
              return (
                <Card
                  key={profile}
                  className={`
                    p-6 cursor-pointer transition-all touch-target
                    ${isSelected 
                      ? 'border-primary bg-primary/10 scale-105' 
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                  onClick={() => setSelectedProfile(profile)}
                  role="button"
                  aria-pressed={isSelected}
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedProfile(profile);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold">{info.label}</h3>
                    {isSelected && (
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  
                  <p className="text-muted-foreground mb-4">
                    {info.description}
                  </p>

                  <ul className="space-y-1">
                    {info.features.map((feature, idx) => (
                      <li key={idx} className="text-sm flex items-center gap-2">
                        <span className="text-primary">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleComplete}
            disabled={!selectedProfile || isLoading}
            className="touch-target text-xl px-12 py-6"
          >
            {isLoading ? 'Setting up...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
};
