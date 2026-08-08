import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

export function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

export function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={cn('flex flex-row items-center gap-1', className)} {...props} />;
}

export function PaginationItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li className={cn('', className)} {...props} />;
}

interface PaginationLinkProps extends React.ComponentProps<typeof Button> {
  isActive?: boolean;
}

export function PaginationLink({ className, isActive, size = 'icon', ...props }: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? 'outline' : 'ghost'}
      size={size}
      aria-current={isActive ? 'page' : undefined}
      className={cn('size-8 text-xs font-medium', className)}
      {...props}
    />
  );
}

export function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('h-8 gap-1 pl-2.5 pr-3 text-xs font-medium text-foreground', className)}
      {...props}
    >
      <ChevronLeft className="size-4" />
      <span>Previous</span>
    </Button>
  );
}

export function PaginationNext({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('h-8 gap-1 pl-3 pr-2.5 text-xs font-medium text-foreground', className)}
      {...props}
    >
      <span>Next</span>
      <ChevronRight className="size-4" />
    </Button>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden="true"
      className={cn('flex size-8 items-center justify-center text-muted-foreground', className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}
