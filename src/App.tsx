import React from 'react';
import { TripProvider, useTrip } from './context/TripContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { TripsView } from './components/TripsView';
import { TimelineView } from './components/TimelineView';
import { AddExpenseDrawer } from './components/AddExpenseDrawer';
import { SettlementView } from './components/SettlementView';
import { SettingsView } from './components/SettingsView';

const MainContent: React.FC = () => {
  const { activeTab } = useTrip();

  return (
    <main className="max-w-lg mx-auto px-4 pt-4 pb-24">
      {activeTab === 'trips' && <TripsView />}
      {activeTab === 'timeline' && <TimelineView />}
      {activeTab === 'settle' && <SettlementView />}
      {activeTab === 'settings' && <SettingsView />}
      <AddExpenseDrawer />
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
