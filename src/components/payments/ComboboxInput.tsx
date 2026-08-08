import React, { useState, useEffect, useRef } from 'react';
import { getSuggestions } from '@/api/payments';
import { EntityType, MasterSuggestion } from '@/types/payment';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ComboboxInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (val: string) => void;
  entityName: EntityType;
  label: string;
  requiredMark?: boolean;
  required?: boolean;
  invalid?: boolean;
  error?: string;
  icon?: React.ReactNode;
  className?: string;
  maxLength?: number;
  showCount?: boolean;
  placeholder?: string;
}

function renderHighlightedText(text: string, query: string) {
  if (!query.trim()) return <span>{text}</span>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={`mark-${part}-${i}`}
            className="rounded-xs bg-primary/15 px-0.5 font-medium text-foreground underline underline-offset-2"
          >
            {part}
          </mark>
        ) : (
          <span key={`text-${part}-${i}`}>{part}</span>
        )
      )}
    </span>
  );
}

export function ComboboxInput({
  id,
  name,
  value,
  onChange,
  entityName,
  label,
  requiredMark = false,
  required = false,
  invalid = false,
  error,
  icon,
  className,
  maxLength,
  showCount = false,
  placeholder
}: ComboboxInputProps) {
  const [suggestions, setSuggestions] = useState<MasterSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fieldError = error;
  const showCharCount = Boolean(showCount && maxLength);

  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    try {
      const result = await getSuggestions(entityName, query.trim());
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setSuggestions(result.data);
        setSearchQuery(query);
        setIsOpen(true);
        setActiveIndex(-1);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    } catch {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const ignoredKeys = ['ArrowUp', 'ArrowDown', 'Enter', 'Escape', 'Tab', 'Shift', 'Control', 'Alt', 'Meta'];
    if (ignoredKeys.includes(e.key)) return;

    const val = e.currentTarget.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => {
        const next = (prev + 1) % suggestions.length;
        scrollToIndex(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => {
        const next = (prev - 1 + suggestions.length) % suggestions.length;
        scrollToIndex(next);
        return next;
      });
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        onChange(suggestions[activeIndex].name);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const scrollToIndex = (index: number) => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('li');
      if (items[index]) {
        items[index].scrollIntoView({ block: 'nearest' });
      }
    }
  };

  const handleSelect = (suggestionName: string) => {
    onChange(suggestionName);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMatch = (name: string) => value.toLowerCase() === name.toLowerCase();

  return (
    <Field data-invalid={fieldError ? true : undefined} className="w-full">
      <FieldLabel htmlFor={id}>
        {label}
        {requiredMark ? <span className="text-destructive"> *</span> : null}
      </FieldLabel>

      <div ref={wrapperRef} className="relative">
        {icon ? (
          <span className="pointer-events-none absolute top-1/2 left-2.5 z-[1] -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        ) : null}

        <Input
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyUp={handleKeyUp}
          onKeyDown={handleKeyDown}
          required={required}
          maxLength={maxLength}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls={`${id}-listbox`}
          aria-invalid={invalid || fieldError ? true : undefined}
          placeholder={placeholder}
          className={cn(icon && 'pl-9', showCharCount && 'pr-12', className)}
        />

        {showCharCount ? (
          <span
            className="pointer-events-none absolute top-1/2 right-2.5 z-[1] -translate-y-1/2 text-[11px] tabular-nums text-muted-foreground"
            aria-hidden="true"
          >
            {value.length}/{maxLength}
          </span>
        ) : null}

        {isOpen && suggestions.length > 0 ? (
          <ul
            ref={listRef}
            id={`${id}-listbox`}
            role="listbox"
            className="absolute top-full right-0 left-0 z-50 mt-1.5 max-h-44 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
          >
            {suggestions.map((item, idx) => (
              <li
                key={item.id ? `id-${item.id}` : `name-${item.name}`}
                role="option"
                aria-selected={idx === activeIndex}
                onMouseDown={e => {
                  e.preventDefault();
                  handleSelect(item.name);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                  idx === activeIndex
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span className="truncate">{renderHighlightedText(item.name, searchQuery)}</span>
                {isMatch(item.name) ? (
                  <Check className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
