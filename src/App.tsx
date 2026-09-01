import React from 'react';
import { TripProvider, useTrip } from './context/TripContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { TripsView } from './components/TripsView';
import { TimelineView } from './components/TimelineView';
import { AddExpenseDrawer } from './components/AddExpenseDrawer';
import { SettlementView } from './components/SettlementView';
import { SettingsView } from './components/SettingsView';
import { ShareTripModal } from './components/ShareTripModal';

const MainContent: React.FC = () => {
  const { activeTab } = useTrip();

  return (
    <main className="max-w-5xl mx-auto px-4 pt-4 pb-24">
      {/* Mobile-Only Tabs View (< 768px) */}
      <div className="block md:hidden">
        {activeTab === 'trips' && <TripsView />}
        {activeTab === 'timeline' && <TimelineView />}
        {activeTab === 'settle' && <SettlementView />}
        {activeTab === 'settings' && <SettingsView />}
      </div>

      {/* Responsive Desktop & Tablet View (>= 768px) */}
      <div className="hidden md:block">
        {activeTab === 'trips' && <TripsView />}
        {activeTab === 'settings' && <SettingsView />}

        {/* Dual-Pane Productivity Layout for Timeline & Settlement */}
        {(activeTab === 'timeline' || activeTab === 'settle') && (
          <div className="grid grid-cols-12 gap-6 items-start">
            <div className="col-span-7">
              <TimelineView />
            </div>
            <div className="col-span-5 sticky top-18">
              <SettlementView />
            </div>
          </div>
        )}
      </div>

      <AddExpenseDrawer />
      <ShareTripModal />
    </main>
  );
};

function AppShell() {
  const { theme } = useTrip();

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#0e121b] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      <Header />
      <MainContent />
      <BottomNav />
    </div>
  );
}

export function App() {
  return (
    <TripProvider>
      <AppShell />
    </TripProvider>
  );
}

export default App;
