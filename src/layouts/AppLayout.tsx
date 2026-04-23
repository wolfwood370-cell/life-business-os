import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { BottomNav } from '@/components/crm/BottomNav';
import { SideNav } from '@/components/crm/SideNav';
import { QuickAddModal } from '@/components/crm/QuickAddModal';

export const AppLayout = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background flex w-full">
      <SideNav onFabClick={() => setOpen(true)} />
      <div className="flex-1 min-w-0">
        <div className="mx-auto w-full max-w-md md:max-w-5xl xl:max-w-7xl min-h-screen pb-32 md:pb-8 md:px-6" style={{ paddingBottom: 'max(8rem, calc(7rem + env(safe-area-inset-bottom)))' }}>
          <Outlet context={{ openQuickAdd: () => setOpen(true) }} />
        </div>
      </div>
      <div className="md:hidden">
        <BottomNav onFabClick={() => setOpen(true)} />
      </div>
      <QuickAddModal open={open} onOpenChange={setOpen} />
    </div>
  );
};
