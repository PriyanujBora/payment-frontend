import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RecordViewFilter } from '@/types/payment';
import { Download } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  value: RecordViewFilter;
  onChange: (value: RecordViewFilter) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function ExportModal({ isOpen, value, onChange, onClose, onConfirm }: ExportModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export CSV</DialogTitle>
          <DialogDescription>Choose which records to include in the download.</DialogDescription>
        </DialogHeader>

        <Tabs
          value={value}
          onValueChange={next => onChange(next as RecordViewFilter)}
          className="w-full"
        >
          <TabsList className="w-full" aria-label="Export record type">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="supplier">Supplier</TabsTrigger>
            <TabsTrigger value="worker">Worker</TabsTrigger>
          </TabsList>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm}>
            <Download data-icon="inline-start" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
