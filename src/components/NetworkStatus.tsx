import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface NetworkStatusProps {
  queueCount?: number;
}

export const NetworkStatus = ({ queueCount = 0 }: NetworkStatusProps) => {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline && queueCount === 0) {
    return null; // Don't show when everything is fine
  }

  if (!isOnline) {
    return (
      <Badge variant="destructive" className="gap-2">
        <WifiOff className="h-3 w-3" />
        Offline - Messages will queue
      </Badge>
    );
  }

  if (wasOffline && queueCount > 0) {
    return (
      <Badge variant="secondary" className="gap-2">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Syncing {queueCount} message{queueCount !== 1 ? 's' : ''}...
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-2">
      <Wifi className="h-3 w-3" />
      Online
    </Badge>
  );
};
