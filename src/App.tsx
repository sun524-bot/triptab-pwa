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
    <main className="max-w-lg mx-auto px-4 pt-4 pb-20">
      {activeTab === 'trips' && <TripsView />}
      {activeTab === 'timeline' && <TimelineView />}
      {activeTab === 'settle' && <SettlementView />}
      {activeTab === 'settings' && <SettingsView />}
      <AddExpenseDrawer />
    </main>
  );
};

export function App() {
  return (
    <TripProvider>
      <div className="min-h-screen bg-[#0e121b] text-slate-100 dark:bg-[#0e121b] dark:text-slate-100 light:bg-slate-50 light:text-slate-900 transition-colors">
        <Header />
        <MainContent />
        <BottomNav />
      </div>
    </TripProvider>
  );
}

export default App;
