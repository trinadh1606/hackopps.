import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[], enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape key even in input fields
        if (event.key !== 'Escape') return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        
        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch &&
          altMatch
        ) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
};

// Global shortcuts hook for app-wide shortcuts
export const useGlobalShortcuts = () => {
  const navigate = useNavigate();

  const globalShortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrl: true,
      action: () => navigate('/home'),
      description: 'New conversation'
    },
    {
      key: 'f',
      ctrl: true,
      action: () => {
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        searchInput?.focus();
      },
      description: 'Focus search'
    },
    {
      key: 'Escape',
      action: () => window.history.back(),
      description: 'Go back'
    },
    {
      key: ',',
      ctrl: true,
      action: () => navigate('/settings'),
      description: 'Open settings'
    }
  ];

  useKeyboardShortcuts(globalShortcuts);
};

// Chat-specific shortcuts
export const useChatShortcuts = (actions: {
  onRead?: () => void;
  onStop?: () => void;
  onPlayPause?: () => void;
}) => {
  const shortcuts: KeyboardShortcut[] = [
    ...(actions.onRead ? [{
      key: 'r',
      action: actions.onRead,
      description: 'Read message aloud'
    }] : []),
    ...(actions.onStop ? [{
      key: 's',
      action: actions.onStop,
      description: 'Stop playback'
    }] : []),
    ...(actions.onPlayPause ? [{
      key: ' ',
      action: actions.onPlayPause,
      description: 'Play/pause'
    }] : [])
  ];

  useKeyboardShortcuts(shortcuts);
};
