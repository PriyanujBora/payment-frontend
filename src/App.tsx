import { PaymentsPage } from '@/pages/PaymentsPage';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function App() {
  return (
    <TooltipProvider>
      <PaymentsPage />
      <Toaster richColors closeButton position="top-right" />
    </TooltipProvider>
  );
}
