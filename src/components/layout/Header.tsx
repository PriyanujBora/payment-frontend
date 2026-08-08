import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Moon, Plus, Sun } from 'lucide-react';
import type { Theme } from '@/hooks/useTheme';

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  onAddPayment: () => void;
}

export function Header({ theme, onToggleTheme, onAddPayment }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <span className="text-base font-bold tracking-tight">PayMaster</span>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onToggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun /> : <Moon />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Switch to {theme === 'dark' ? 'light' : 'dark'} mode
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" onClick={onAddPayment}>
                <Plus data-icon="inline-start" />
                New record
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Record new payment (Ctrl+K)</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
